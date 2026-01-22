import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "./db";
import bcrypt from "bcryptjs";
import { z } from "zod";

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
                        email: email.toLowerCase()
                    });

                    if (!user) {
                        console.log("[Auth INFO] User not found in DB:", email);
                        return null;
                    }

                    // Verificar contraseña
                    const isValidPassword = await bcrypt.compare(password, user.password);
                    if (!isValidPassword) {
                        console.log("[Auth WARN] Invalid password for user:", email);
                        return null;
                    }

                    console.log("[Auth SUCCESS] Login successful for:", email);

                    // Retornar usuario con rol y tenant context
                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.nombre,
                        role: user.rol, // ADMIN | TECNICO | INGENIERIA
                        tenantId: user.tenantId || process.env.SINGLE_TENANT_ID || 'default_tenant',
                        industry: user.industry || 'ELEVATORS',
                        activeModules: user.activeModules || ['TECHNICAL', 'RAG'],
                        image: user.foto_url,
                    };
                } catch (error) {
                    console.error("[Auth ERROR] Exception during authorize:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                // @ts-ignore
                token.id = user.id;
                // @ts-ignore
                token.role = user.role;
                // @ts-ignore
                token.tenantId = user.tenantId;
                // @ts-ignore
                token.industry = user.industry;
                // @ts-ignore
                token.activeModules = user.activeModules;
                // @ts-ignore
                token.image = user.image;
            }

            // Manejar actualización de sesión (Visión 2.0)
            if (trigger === "update" && session?.user) {
                if (session.user.image) token.image = session.user.image;
                if (session.user.name) token.name = session.user.name;
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                // @ts-ignore
                session.user.tenantId = token.tenantId as string;
                // @ts-ignore
                session.user.industry = token.industry as string;
                // @ts-ignore
                session.user.activeModules = token.activeModules as string[];
                session.user.image = token.image as string;
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
