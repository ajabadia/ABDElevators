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
            if (user) {
                token.id = user.id!;
                token.role = user.role;
                token.baseRole = user.baseRole;
                token.tenantId = user.tenantId;
                token.industry = user.industry;
                token.activeModules = user.activeModules;
                token.image = user.image;
                token.tenantAccess = user.tenantAccess;
                token.permissionGroups = user.permissionGroups;
                token.permissionOverrides = user.permissionOverrides;
                token.lastValidated = Date.now();
            }

            // Manejar actualización de sesión (Visión 2.0)
            if (trigger === "update" && session?.user) {
                if (session.user.image) token.image = session.user.image;
                if (session.user.name) token.name = session.user.name;
                if (session.user.tenantId) token.tenantId = session.user.tenantId;
                if (session.user.role) token.role = session.user.role;
                if (session.user.industry) token.industry = session.user.industry;
            }

            return token;
        },
        async session({ session, token }) {
            // Sincronizar campos del token a la sesión (Auditoría P0: Higiene de tipos)
            // Se usa cast local para asegurar que TS reconozca los campos extendidos en JWT
            const t = token as any;
            if (session.user && t) {
                session.user.id = t.id;
                session.user.role = t.role;
                session.user.baseRole = t.baseRole;
                session.user.tenantId = t.tenantId;
                session.user.industry = t.industry;
                session.user.activeModules = t.activeModules || [];
                session.user.image = t.image;
                session.user.tenantAccess = t.tenantAccess;
                session.user.permissionGroups = t.permissionGroups || [];
                session.user.permissionOverrides = t.permissionOverrides || [];
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
