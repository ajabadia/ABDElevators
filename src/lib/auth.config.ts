import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
        error: "/auth-pages/error",
    },
    basePath: "/api/auth",
    trustHost: true,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === "production"
                ? "__Secure-next-auth.session-token"
                : "next-auth.session-token",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            }
        }
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            console.log("🧩 [JWT Callback] Triggered. User?", !!user, "Trigger:", trigger);
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.baseRole = user.baseRole;
                token.tenantId = user.tenantId;
                token.industry = user.industry;
                token.activeModules = user.activeModules;
                token.image = user.image;
                token.tenantAccess = user.tenantAccess;
                token.lastValidated = Date.now();
            }

            // Manejar actualización de sesión (Visión 2.0)
            if (trigger === "update" && session?.user) {
                console.log("🔄 [JWT Update] Session update requested");
                if (session.user.image) token.image = session.user.image as string;
                if (session.user.name) token.name = session.user.name as string;
                if (session.user.tenantId) token.tenantId = session.user.tenantId as string;
                if (session.user.role) token.role = session.user.role as string;
                if (session.user.industry) token.industry = session.user.industry as string;
            }

            return token;
        },
        async session({ session, token }) {
            // console.log("📦 [Session Callback] Token ID:", token.id);
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
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/admin');

            if (isOnDashboard) {
                return isLoggedIn;
            }
            return true;
        },
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig;
