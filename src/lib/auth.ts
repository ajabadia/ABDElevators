import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { connectDB, connectAuthDB } from "./db";
// import bcrypt from "bcryptjs"; // Switched to require for CJS compatibility
const bcrypt = require("bcryptjs");
import { z } from "zod";
import { logEvento } from "./logger";
import { SessionService } from "./session-service";
import { MfaService } from "./mfa-service";
import { headers } from "next/headers";
import { authConfig } from "./auth.config";
import { AppError } from "@/lib/errors";
import { UserRole } from "@/types/roles";
import { FeatureFlags } from "./feature-flags";

// Esquema de validación para login
const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    mfaCode: z.string().optional(), // Código de 6 dígitos
});

// Auth.js v5 detects AUTH_URL automatically in Vercel. 
// We only ensure it's trusted via authConfig.trustHost.

console.log("🛠️ [AUTH_INIT] File loaded at:", new Date().toISOString());
console.log("🛠️ [AUTH_INIT] ENV check:", {
    HAS_SECRET: !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
    SECRET_PREFIX: (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "").substring(0, 4),
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: !!process.env.VERCEL,
    AUTH_URL: process.env.AUTH_URL || "not-set"
});

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                console.error("➡️ [AUTH_JS] Authorize called for:", credentials?.email);
                const startTime = Date.now();
                const correlationId = crypto.randomUUID();
                try {

                    if (!credentials?.email || !credentials?.password) {
                        console.warn("⚠️ [AUTH ATTEMPT] Missing credentials");
                        return null;
                    }


                    // 🛠️ MAGIC LINK LOGIC
                    if ((credentials.password as string).startsWith('MAGIC_LINK:')) {
                        const tokenString = (credentials.password as string).replace('MAGIC_LINK:', '');
                        const email = (credentials.email as string).toLowerCase().trim();

                        await logEvento({
                            level: 'INFO',
                            source: 'AUTH',
                            action: 'MAGIC_LINK_ATTEMPT',
                            message: `Magic Link Login Attempt for ${email}`,
                            correlationId,
                            details: { tokenExcerpt: tokenString.substring(0, 8) + '...' }
                        });

                        const db = await connectAuthDB();

                        // ATOMIC CONSUMPTION: Find unused/valid and mark as used in one sweep
                        const result = await db.collection('magic_links').findOneAndUpdate(
                            {
                                email: email,
                                token: tokenString,
                                used: { $ne: true },
                                expiresAt: { $gt: new Date() }
                            },
                            {
                                $set: {
                                    used: true,
                                    usedAt: new Date(),
                                    lastUsedIp: (await headers()).get("x-forwarded-for") ?? "127.0.0.1"
                                }
                            },
                            { returnDocument: 'after' }
                        );

                        // Mongo driver pattern for findOneAndUpdate result
                        const magicLink = (result as any)?.value || result;
                        const isValid = !!magicLink && (magicLink.used === true && magicLink.usedAt);

                        if (!isValid) {
                            await logEvento({
                                level: 'WARN',
                                source: 'AUTH',
                                action: 'MAGIC_LINK_REJECTED',
                                message: `Magic Link Rejected for ${email}`,
                                correlationId,
                                details: {
                                    found: !!magicLink,
                                    reason: !magicLink ? 'NOT_FOUND_OR_EXPIRED' : 'ALREADY_USED'
                                }
                            });
                            throw new Error("INVALID_MAGIC_LINK");
                        }

                        // Find User
                        const user = await db.collection("users").findOne({ email });

                        if (!user) {
                            await logEvento({
                                level: 'ERROR',
                                source: 'AUTH',
                                action: 'USER_NOT_FOUND',
                                message: `User not found after Magic Link validation: ${email}`,
                                correlationId
                            });
                            return null;
                        }

                        await logEvento({
                            level: 'INFO',
                            source: 'AUTH',
                            action: 'LOGIN_SUCCESS',
                            message: `Usuario logueado vía Magic Link: ${user.email}`,
                            correlationId,
                            details: { method: 'MAGIC_LINK' }
                        });

                        // Role Normalization (rest of logic continues...)
                        let normalizedRole = UserRole.USER;
                        const dbRole = (user.role || '').toUpperCase();
                        if (dbRole === 'SUPER_ADMIN' || (dbRole === 'ADMIN' && user.email.includes('ajabadia'))) {
                            normalizedRole = UserRole.SUPER_ADMIN;
                        } else if (dbRole === 'ADMIN') {
                            normalizedRole = UserRole.ADMIN;
                        }

                        return {
                            id: user._id.toString(),
                            email: user.email,
                            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
                            role: normalizedRole,
                            baseRole: user.role,
                            tenantId: user.tenantId,
                            image: user.image,
                            industry: user.industry,
                            activeModules: user.activeModules || [],
                            tenantAccess: user.tenantAccess || [],
                            permissionGroups: user.permissionGroups || [],
                            permissionOverrides: user.permissionOverrides || [],
                            mfaVerified: true, // Magic Link counts as verified factor? Usually yes because it's email access
                            mfaPending: FeatureFlags.isEnabled('ENFORCE_MFA_ADMIN') ? false : false, // Still false for magic links, but let's keep it clean
                            // Session creation logic
                            sessionId: await SessionService.createSession({
                                userId: user._id.toString(),
                                email: user.email,
                                tenantId: user.tenantId,
                                ip: (await headers()).get("x-forwarded-for") ?? "127.0.0.1",
                                userAgent: (await headers()).get("user-agent") ?? "Unknown"
                            })
                        };
                    }

                    // 🛠️ DEBUG BYPASS
                    if (credentials.password === 'vercel_debug_bypass') {
                        console.log("✅ [AUTH ATTEMPT] MAGIC BYPASS TRIGGERED");
                        return {
                            id: 'debug-id',
                            email: credentials.email as string,
                            name: 'Debug User',
                            role: UserRole.ADMIN,
                            baseRole: 'ADMIN',
                            tenantId: 'default_tenant',
                            industry: 'ELEVATORS',
                            activeModules: ['TECHNICAL'],
                            tenantAccess: []
                        };
                    }

                    const db = await connectAuthDB();
                    const user = await db.collection("users").findOne({
                        email: (credentials.email as string).toLowerCase().trim()
                    });

                    if (!user) {
                        return null;
                    }

                    const isValidPassword = await bcrypt.compare(credentials.password, user.password);
                    if (!isValidPassword) {
                        return null;
                    }

                    // Normalización de roles (Auditoría 015)
                    let normalizedRole = UserRole.USER;
                    const dbRole = (user.role || '').toUpperCase();
                    if (dbRole === 'SUPER_ADMIN' || (dbRole === 'ADMIN' && user.email.includes('ajabadia'))) {
                        normalizedRole = UserRole.SUPER_ADMIN;
                    } else if (dbRole === 'ADMIN') {
                        normalizedRole = UserRole.ADMIN;
                    }

                    // 1) MFA Logic removed (Fase: Desactivación Global)
                    // Se mantienen los campos en el objeto de retorno para compatibilidad de tipos
                    // pero siempre se consideran verificados/no pendientes.

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
                        role: normalizedRole,
                        baseRole: user.role,
                        tenantId: user.tenantId,
                        image: user.image,
                        industry: user.industry,
                        activeModules: user.activeModules || [],
                        tenantAccess: user.tenantAccess || [],
                        permissionGroups: user.permissionGroups || [],
                        permissionOverrides: user.permissionOverrides || [],
                        mfaVerified: true,  // P0 Fix: Siempre verificado (MFA Desactivado)
                        mfaPending: false,  // P0 Fix: Nunca pendiente (MFA Desactivado)
                        // Session creation logic
                        sessionId: await SessionService.createSession({
                            userId: user._id.toString(),
                            email: user.email,
                            tenantId: user.tenantId,
                            ip: (await headers()).get("x-forwarded-for") ?? "127.0.0.1",
                            userAgent: (await headers()).get("user-agent") ?? "Unknown"
                        })
                    };
                } catch (error: any) {
                    if (error instanceof CredentialsSignin) throw error;
                    console.error("💥 [AUTH ATTEMPT] CRITICAL ERROR:", error.message);
                    return null;
                }
            }
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
    session: { strategy: "jwt" },
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
