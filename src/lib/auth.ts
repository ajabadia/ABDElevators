import NextAuth from "next-auth";
import { type EntityId, type TenantId } from "@/lib/schemas/common";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { authorizeCredentials } from "./auth-utils";
import { SessionService } from "@/services/auth/SessionService";
import { AppError } from "@/lib/errors";
import { UserRole } from "@/types/roles";
import { GuardianEngine, type EvaluationUser } from "@/core/guardian/GuardianEngine";
import { logEvento } from "@/lib/logger";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                mfaCode: { label: "MFA Code", type: "text", optional: true },
            },
            authorize: (credentials, req) => authorizeCredentials(credentials, req)
        })
    ],
    events: {
        async signOut(data) {
            // Safe access for token in NextAuth v5 event
            const token = ('token' in data ? data.token : null) as { sessionId?: string, id?: string } | null;
            if (token?.sessionId && token.id) {
                await SessionService.revokeSession(token.sessionId, token.id).catch(console.error);
            }
        }
    },
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    // session strategy is now in auth.config.ts
    debug: process.env.NODE_ENV !== 'production',
    logger: {
        error(error: unknown) {
            // Already handled by events/callbacks often, but good to have a clean fallback
            if (process.env.NODE_ENV !== 'production') {
                console.error(`❌ [AUTH_JS_ERROR]`, error);
            }
        },
        warn(code: string) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn(`⚠️ [AUTH_JS_WARN] ${code}`);
            }
        },
        debug(code: string, metadata?: unknown) {
            // Only log debug in non-production
            if (process.env.NODE_ENV !== 'production') {
                console.log(`🔍 [AUTH_JS_DEBUG] ${code}`, metadata || "");
            }
        },
    },
});

export async function requireAuth() {
    const session = await auth();
    if (!session?.user) throw new AppError('UNAUTHORIZED', 401, 'No session active');
    return session;
}

/**
 * Helper unificado para requerir roles específicos (Auditoría 015)
 */
export async function requireRole(allowedRoles: UserRole[]) {
    const session = await auth();
    if (!session?.user) throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    if (!allowedRoles.includes(session.user.role as UserRole)) {
        throw new AppError('FORBIDDEN', 403, `Permission Denied. Required: ${allowedRoles.join(', ')}`);
    }
    return session;
}

export async function requireSuperAdmin() {
    return requireRole([UserRole.SUPER_ADMIN]);
}

/**
 * NEW: Require specific permission using Guardian V3 Engine (ABAC)
 */
export async function requirePermission(resource: string, action: string) {
    const session = await auth();
    if (!session?.user) {
        throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    }

    const engine = GuardianEngine.getInstance();
    const result = await engine.evaluate(
        {
            id: session.user.id as EntityId,
            tenantId: session.user.tenantId as TenantId,
            role: session.user.role as UserRole
        },
        resource,
        action
    );

    if (!result.allowed) {
        await logEvento({
            level: 'WARN',
            source: 'AUTH_GUARD',
            action: 'PERMISSION_DENIED',
            message: `Permission denied for ${session.user.email} on ${resource}:${action}`,
            correlationId: session.user.id || 'system',
            details: { reason: result.reason, resource, action }
        });
        throw new AppError('FORBIDDEN', 403, `Permission denied: ${result.reason}`);
    }

    await logEvento({
        level: 'DEBUG',
        source: 'AUTH_GUARD',
        action: 'PERMISSION_GRANTED',
        message: `Permission granted for ${session.user.email} on ${resource}:${action}`,
        correlationId: session.user.id || 'system',
        details: { resource, action }
    });

    return session;
}
