import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB, connectAuthDB } from "./db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { logEvento } from "./logger";
import { SessionService } from "./session-service";
import { MfaService } from "./mfa-service";
import { headers } from "next/headers";
import { authConfig } from "./auth.config";
import { AppError } from "@/lib/errors";

// Esquema de validación para login
const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    mfaCode: z.string().optional(), // Código de 6 dígitos
});

// Vercel Fix: Ensure AUTH_URL is set
if (!process.env.AUTH_URL && process.env.VERCEL_URL) {
    process.env.AUTH_URL = `https://${process.env.VERCEL_URL}`;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // FORCE CONSOLE LOG - DEBUG VERCEL
                console.log("🔥 [AUTH START] Authorize called. Email:", credentials?.email);
                console.log("   -> AUTH_URL Configured:", process.env.AUTH_URL ? "YES" : "NO");

                try {
                    console.log("🕵️ [Auth Step] Parsing credentials...");
                    console.log("[Auth DEBUG] Received credentials for email:", credentials?.email);
                    if (!credentials) {
                        console.error("[Auth ERROR] No credentials object received");
                        return null;
                    }

                    // 🛠️ DEBUG BYPASS: Test structural Auth flow without DB
                    if (credentials.password === 'vercel_debug_bypass') {
                        console.log("bypass triggered");
                        return {
                            id: 'debug-id',
                            email: credentials.email as string,
                            name: 'Debug User',
                            role: 'ADMIN',
                            baseRole: 'ADMIN',
                            tenantId: 'default_tenant',
                            industry: 'ELEVATORS',
                            activeModules: ['TECHNICAL'],
                            tenantAccess: []
                        };
                    }

                    // Validar credenciales con Zod (Regla de Oro #2)
                    const validated = LoginSchema.parse(credentials);
                    const { email, password } = validated;

                    // Conectar a MongoDB de Seguridad (Identity Suite)
                    // NOTA: Esto solo corre en Node.js (API routes), no en Middleware
                    const db = await connectAuthDB();

                    const user = await db.collection("users").findOne({
                        email: email.toLowerCase().trim()
                    });

                    if (!user) {
                        await logEvento({
                            level: 'WARN',
                            source: 'AUTH',
                            action: 'LOGIN_FAIL_USER_NOT_FOUND',
                            message: `Intento de login fallido: ${email} (no existe)`,
                            correlationId: `auth-fail-${Date.now()}`
                        });
                        return null;
                    }

                    // Verificar contraseña
                    const isValidPassword = await bcrypt.compare(password, user.password);

                    if (!isValidPassword) {
                        await logEvento({
                            level: 'WARN',
                            source: 'AUTH',
                            action: 'LOGIN_FAIL_PASSWORD',
                            message: `Intento de login fallido: ${email} (contraseña incorrecta)`,
                            correlationId: `auth-fail-${Date.now()}`
                        });
                        return null;
                    }

                    // 🔐 Verificar MFA (Fase 11)
                    if (user.mfaEnabled) {
                        const { mfaCode } = validated;

                        if (!mfaCode) {
                            await logEvento({
                                level: 'INFO',
                                source: 'AUTH',
                                action: 'MFA_REQUIRED',
                                message: `Login paso 1: Usuario ${email} requiere MFA`,
                                correlationId: `auth-mfa-${Date.now()}`
                            });
                            // Lanzamos un error específico que el frontend pueda capturar
                            throw new Error("MFA_REQUIRED");
                        }

                        const isMfaValid = await MfaService.verify(user._id.toString(), mfaCode);
                        if (!isMfaValid) {
                            await logEvento({
                                level: 'WARN',
                                source: 'AUTH',
                                action: 'MFA_FAIL',
                                message: `Intento de login fallido: Código MFA incorrecto para ${email}`,
                                correlationId: `auth-mfa-err-${Date.now()}`,
                                details: { email }
                            });
                            throw new Error("INVALID_MFA_CODE");
                        }
                    }

                    await logEvento({
                        level: 'INFO',
                        source: 'AUTH',
                        action: 'LOGIN_SUCCESS',
                        message: `Usuario logueado: ${email}`,
                        correlationId: `auth-${Date.now()}`,
                        details: { email, userId: user._id.toString() }
                    });

                    // Retornar usuario con rol y tenant context
                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
                        role: user.role, // Acting role
                        baseRole: user.role, // Permanent role from DB
                        tenantId: user.tenantId || process.env.SINGLE_TENANT_ID || 'default_tenant',
                        industry: user.industry || 'ELEVATORS',
                        activeModules: user.activeModules || ['TECHNICAL', 'RAG'],
                        image: user.photoUrl || user.image,
                        tenantAccess: user.tenantAccess || []
                    };
                } catch (error) {
                    console.error("🔥 [AUTH ERROR]", error);
                    return null;
                }
            }
        })
    ],
    // Removemos callbacks duplicados, se heredan de authConfig,
    // PERO podríamos necesitar extender session si quisiéramos validación extra de DB que config no tiene.
    // Por ahora, confiamos en authConfig.
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    debug: true, // Force debug logs on Vercel
});

// 🛡️ SECURITY HELPERS (Fase 35)

/**
 * Ensures a user is authenticated. Throws 401 if not.
 * @returns session
 */
export async function requireAuth() {
    const session = await auth();
    if (!session?.user) {
        throw new AppError('UNAUTHORIZED', 401, 'No session active');
    }
    return session;
}

/**
 * Ensures user is SUPER_ADMIN. Throws 403 if not.
 * Centralizes critical permission logic (DRY).
 * @returns session
 */
export async function requireSuperAdmin() {
    const session = await auth();
    if (!session?.user) {
        throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    }

    if (session.user.role !== 'SUPER_ADMIN') {
        throw new AppError('FORBIDDEN', 403, 'Permission Denied: SUPER_ADMIN required');
    }
    return session;
}
