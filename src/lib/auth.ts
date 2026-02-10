import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { authorizeCredentials } from "./auth-utils";
import { SessionService } from "./session-service";
import { AppError } from "@/lib/errors";
import { UserRole } from "@/types/roles";

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
            const token = 'token' in data ? (data.token as any) : null;
            if (token?.sessionId) {
                await SessionService.revokeSession(token.sessionId, token.id).catch(console.error);
            }
        }
    },
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    // session strategy is now in auth.config.ts
    debug: true,
    logger: {
        error(error: any) {
            console.error(`❌ [AUTH_JS_ERROR]`, error);
        },
        warn(code: any) {
            console.warn(`⚠️ [AUTH_JS_WARN] ${code}`);
        },
        debug(code: any, metadata?: any) {
            console.log(`🔍 [AUTH_JS_DEBUG] ${code}`, metadata || "");
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
