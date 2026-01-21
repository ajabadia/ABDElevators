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
                    // Validar credenciales con Zod (Regla de Oro #2)
                    const { email, password } = LoginSchema.parse(credentials);

                    // Conectar a MongoDB
                    const db = await connectDB();
                    const user = await db.collection("usuarios").findOne({ email });

                    if (!user) {
                        return null;
                    }

                    // Verificar contraseña
                    const isValidPassword = await bcrypt.compare(password, user.password);
                    if (!isValidPassword) {
                        return null;
                    }

                    // Retornar usuario con rol
                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.nombre,
                        role: user.rol, // ADMIN | TECNICO | INGENIERIA
                    };
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
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
});
