import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "./db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { logEvento } from "./logger";

// Esquema de validación para login
const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    console.log("[Auth DEBUG] Received credentials for email:", credentials?.email);
                    if (!credentials) {
                        console.error("[Auth ERROR] No credentials object received");
                        return null;
                    }

                    // Validar credenciales con Zod (Regla de Oro #2)
                    const { email, password } = LoginSchema.parse(credentials);

                    // Conectar a MongoDB
                    const db = await connectDB();

                    const user = await db.collection("usuarios").findOne({
                        email: email.toLowerCase().trim()
                    });

                    if (!user) {
                        await logEvento({
                            nivel: 'WARN',
                            origen: 'AUTH',
                            accion: 'LOGIN_FAIL_USER_NOT_FOUND',
                            mensaje: `Intento de login fallido: ${email} (no existe)`,
                            correlacion_id: `auth-fail-${Date.now()}`
                        });
                        return null;
                    }

                    // Verificar contraseña
                    const isValidPassword = await bcrypt.compare(password, user.password);

                    if (!isValidPassword) {
                        await logEvento({
                            nivel: 'WARN',
                            origen: 'AUTH',
                            accion: 'LOGIN_FAIL_PASSWORD',
                            mensaje: `Intento de login fallido: ${email} (contraseña incorrecta)`,
                            correlacion_id: `auth-fail-${Date.now()}`
                        });
                        return null;
                    }

                    await logEvento({
                        nivel: 'INFO',
                        origen: 'AUTH',
                        accion: 'LOGIN_SUCCESS',
                        mensaje: `Usuario logueado: ${email}`,
                        correlacion_id: `auth-${Date.now()}`
                    });

                    // Retornar usuario con rol y tenant context
                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.nombre,
                        role: user.rol, // Acting role
                        baseRole: user.rol, // Permanent role from DB
                        tenantId: user.tenantId || process.env.SINGLE_TENANT_ID || 'default_tenant',
                        industry: user.industry || 'ELEVATORS',
                        activeModules: user.activeModules || ['TECHNICAL', 'RAG'],
                        image: user.foto_url,
                        tenantAccess: user.tenantAccess || []
                    };
                } catch (error: any) {
                    console.error("[Auth ERROR] Exception during authorize:", error);
                    try {
                        await logEvento({
                            nivel: 'ERROR',
                            origen: 'AUTH',
                            accion: 'LOGIN_EXCEPTION',
                            mensaje: error.message,
                            correlacion_id: `auth-err-${Date.now()}`,
                            stack: error.stack
                        });
                    } catch (e) {
                        // Si falla el log a DB, no podemos hacer mucho más aquí
                    }
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id as string;
                token.role = user.role as string;
                token.baseRole = user.baseRole as string;
                token.tenantId = user.tenantId as string;
                token.industry = user.industry as string;
                token.activeModules = (user.activeModules as string[]) || [];
                token.image = user.image as string | null | undefined;
                token.tenantAccess = user.tenantAccess;
            }

            // Manejar actualización de sesión (Visión 2.0)
            if (trigger === "update" && session?.user) {
                if (session.user.image) token.image = session.user.image as string;
                if (session.user.name) token.name = session.user.name as string;
                if (session.user.tenantId) token.tenantId = session.user.tenantId as string;
                if (session.user.role) token.role = session.user.role as string;
                if (session.user.industry) token.industry = session.user.industry as string;
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.baseRole = token.baseRole as string;
                session.user.tenantId = token.tenantId as string;
                session.user.industry = token.industry as string;
                session.user.activeModules = token.activeModules as string[];
                session.user.image = token.image as string | null | undefined;
                session.user.tenantAccess = token.tenantAccess as any;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
});
