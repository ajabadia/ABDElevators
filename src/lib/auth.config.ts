import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
        error: "/auth-pages/error",
    },
    basePath: "/api/auth",
    trustHost: true,
    debug: true,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === "production"
                ? "__Secure-authjs.session-token"
                : "authjs.session-token",
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
                token.sessionId = (user as any).sessionId;
                token.mfaVerified = (user as any).mfaVerified ?? false;
                token.mfaPending = (user as any).mfaPending ?? false;
                token.lastValidated = Date.now();
            }

            // Manejar actualización de sesión (Visión 2.0)
            if (trigger === "update" && session?.user) {
                if (session.user.image) token.image = session.user.image;
                if (session.user.name) token.name = session.user.name;
                if (session.user.tenantId) token.tenantId = session.user.tenantId;
                if (session.user.role) token.role = session.user.role;
                if (session.user.industry) token.industry = session.user.industry;
                // Allow updaing MFA status from client
                if (typeof session.user.mfaVerified === 'boolean') token.mfaVerified = session.user.mfaVerified;
                if (typeof session.user.mfaPending === 'boolean') token.mfaPending = session.user.mfaPending;
            }

            return token;
        },
        async session({ session, token }) {
            try {
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

                    // Explicit propagation of MFA flags to session user
                    session.user.mfaVerified = t.mfaVerified === true;
                    session.user.mfaPending = t.mfaPending === true;

                    (session as any).sessionId = t.sessionId; // Pass sessionId to session object
                }
            } catch (error: any) {
                console.error("🔥 [SESSION_CALLBACK_ERROR]", error);
                // Return session anyway to avoid null on client, even if incomplete
            }

            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/admin');

            // 1. Si no está logado, permitir páginas públicas (login/registro)
            if (!isLoggedIn) return true;

            // 2. MFA logic removed (Fase: Desactivación Global)
            // Ya no bloqueamos por mfaPending ni mfaVerified.

            // 3. Protección de dashboard
            if (isOnDashboard) {
                // Roles básicos ya manejados por Guardian, aquí solo verificamos login
                return true;
            }

            return true;
        },
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig;
