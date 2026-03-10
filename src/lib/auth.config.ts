import type { NextAuthConfig, User, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { logEvento } from "./logger";

const LOG_SOURCE = "AUTH_CONFIG";

export const authConfig = {
    pages: {
        signIn: "/login",
        error: "/auth-pages/error",
    },
    basePath: "/api/auth",
    trustHost: true,
    debug: process.env.NODE_ENV !== "production",
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
                const u = user; // Now correctly typed by module augmentation
                const jwtMaskedEmail = u.email ? u.email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + "*".repeat(gp3.length)) : 'unknown';

                await logEvento({
                    level: 'INFO',
                    source: LOG_SOURCE,
                    action: 'JWT_CALLBACK_INIT',
                    message: `New user login detected for ${jwtMaskedEmail}. Enhancing token...`
                });

                await logEvento({
                    level: 'DEBUG',
                    source: LOG_SOURCE,
                    action: 'JWT_CALLBACK_DETAIL',
                    message: `User properties - role: ${u.role}, mfaVerified: ${u.mfaVerified}`,
                    details: { role: u.role, mfaVerified: u.mfaVerified }
                });

                token.id = u.id!;
                token.role = u.role;
                token.baseRole = u.baseRole;
                token.tenantId = u.tenantId;
                token.industry = u.industry;
                token.activeModules = u.activeModules;
                token.image = u.image;
                token.tenantAccess = u.tenantAccess;
                token.permissionGroups = u.permissionGroups;
                token.permissionOverrides = u.permissionOverrides;
                token.sessionId = u.sessionId;
                token.mfaVerified = u.mfaVerified === true;
                token.mfaPending = u.mfaPending === true;
                token.lastValidated = Date.now();

                const jwtSuccessMaskedEmail = u.email ? u.email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + "*".repeat(gp3.length)) : 'unknown';

                await logEvento({
                    level: 'INFO',
                    source: LOG_SOURCE,
                    action: 'JWT_CALLBACK_SUCCESS',
                    message: `Token enhanced for ${jwtSuccessMaskedEmail}. mfaVerified in token: ${token.mfaVerified}`
                });
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
        async session({ session, token }: { session: Session, token: JWT }) {
            try {
                // Sincronizar campos del token a la sesión (Auditoría P0: Higiene de tipos)
                if (session.user && token) {
                    const sessionMaskedEmail = session.user.email ? session.user.email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + "*".repeat(gp3.length)) : 'unknown';

                    if (process.env.NODE_ENV === 'development') {
                        console.debug(`[AUTH_SYNC] Syncing token for ${sessionMaskedEmail}. mfaVerified: ${token.mfaVerified}`);
                    }

                    session.user.id = token.id;
                    session.user.role = token.role;
                    session.user.baseRole = token.baseRole;
                    session.user.tenantId = token.tenantId;
                    session.user.industry = token.industry;
                    session.user.activeModules = token.activeModules || [];
                    session.user.image = token.image;
                    session.user.tenantAccess = token.tenantAccess;
                    session.user.permissionGroups = token.permissionGroups || [];
                    session.user.permissionOverrides = token.permissionOverrides || [];

                    // Explicit propagation of MFA flags to session user
                    session.user.mfaVerified = token.mfaVerified === true;
                    session.user.mfaPending = token.mfaPending === true;

                    session.sessionId = token.sessionId; // sessionId propagation

                    const sessionSuccessMaskedEmail = session.user.email ? session.user.email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + "*".repeat(gp3.length)) : 'unknown';

                    if (process.env.NODE_ENV === 'development') {
                        console.log(`[AUTH_SYNC] Session synced for ${sessionSuccessMaskedEmail}`);
                    }
                }
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                await logEvento({
                    level: 'ERROR',
                    source: LOG_SOURCE,
                    action: 'SESSION_CALLBACK_ERROR',
                    message: `Error in session callback: ${errorMessage}`,
                    details: { error: errorMessage }
                });
            }

            return session;
        },
        async authorized({ auth, request: { nextUrl } }) {
            const pathname = nextUrl.pathname;
            const isLoggedIn = !!auth?.user;
            const mfaPending = auth?.user?.mfaPending === true;
            const isOnDashboard = pathname.startsWith('/admin-dashboard') || pathname.startsWith('/dashboard');

            const authMaskedEmail = auth?.user?.email ? auth.user.email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + "*".repeat(gp3.length)) : 'none';

            if (process.env.NODE_ENV === 'development') {
                console.debug(`[AUTHORIZED_CHECK] Auth check for ${pathname}. User: ${authMaskedEmail}, LoggedIn: ${isLoggedIn}`);
            }

            // 1. Si no está logado, permitir páginas públicas
            if (!isLoggedIn) return true;

            // 2. PROTECCIÓN MFA: Si tiene sesión pero MFA está pendiente, bloquear dashboard
            if (isOnDashboard && mfaPending) {
                await logEvento({
                    level: 'WARN',
                    source: LOG_SOURCE,
                    action: 'MFA_BLOCKED',
                    message: `User ${auth?.user?.email} blocked: MFA Pending`
                });
                return false; // Esto redirigirá al login
            }

            // 3. Protección de dashboard
            if (isOnDashboard) {
                return true;
            }

            return true;
        },
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig;
