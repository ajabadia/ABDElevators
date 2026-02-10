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
    session: { strategy: "jwt" }, // Moved here for middleware consistency
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
                console.log(`🎟️ [JWT_CALLBACK] New user login detected for ${user.email}. Enhancing token...`);
                console.log(`🔎 [JWT_CALLBACK] User properties - role: ${user.role}, mfaVerified: ${(user as any).mfaVerified}`);
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
                token.mfaVerified = (user as any).mfaVerified === true;
                token.mfaPending = (user as any).mfaPending === true;
                token.lastValidated = Date.now();
                console.log(`✅ [JWT_CALLBACK] Token enhanced for ${user.email}. mfaVerified in token: ${token.mfaVerified}`);
            }

            // Manejar actualización de sesión (Visión 2.0)
            if (trigger === "update" && session?.user) {
                if (session.user.image) token.image = session.user.image;
                if (session.user.name) token.name = session.user.name;
                if (session.user.tenantId) token.tenantId = session.user.tenantId;
                if (session.user.role) token.role = session.user.role;
                if (session.user.industry) token.industry = session.user.industry;
                // Allow updating MFA status from client
                if (typeof session.user.mfaVerified === 'boolean') token.mfaVerified = session.user.mfaVerified;
                if (typeof session.user.mfaPending === 'boolean') token.mfaPending = session.user.mfaPending;
            }

            return token;
        },
        async session({ session, token }) {
            try {
                // Sincronizar campos del token a la sesión (Auditoría P0: Higiene de tipos)
                const t = token as any;
                if (session.user && t) {
                    console.log(`🤝 [SESSION_CALLBACK] Syncing token for ${session.user.email}. mfaVerified: ${t.mfaVerified}`);
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
                    console.log(`✅ [SESSION_CALLBACK] Session synced for ${session.user.email}`);
                }
            } catch (error: any) {
                console.error("🔥 [SESSION_CALLBACK_ERROR]", error);
            }

            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const pathname = nextUrl.pathname;
            const isLoggedIn = !!auth?.user;
            const mfaPending = (auth?.user as any)?.mfaPending === true;
            const isOnDashboard = pathname.startsWith('/admin') || pathname.startsWith('/dashboard');

            console.log(`🛡️ [AUTHORIZED] ${pathname} | User: ${auth?.user?.email || 'none'} | LoggedIn: ${isLoggedIn} | MFA Pending: ${mfaPending}`);

            // 1. Si no está logado, permitir páginas públicas
            if (!isLoggedIn) return true;

            // 2. PROTECCIÓN MFA: Si tiene sesión pero MFA está pendiente, bloquear dashboard
            if (isOnDashboard && mfaPending) {
                console.warn(`🛑 [AUTHORIZED_CALLBACK] User ${auth?.user?.email} blocked: MFA Pending`);
                return false; // Esto redirigirá al login
            }

            // 3. Protección de dashboard
            if (isOnDashboard) {
                console.log(`✅ [AUTHORIZED_CALLBACK] Access granted to ${auth?.user?.email}`);
                return true;
            }

            return true;
        },
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig;
