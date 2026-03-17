import type { NextAuthConfig, User, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { logEvento } from "./logger";
import { UserRole } from "../types/roles";
import { IndustryType } from "./schemas";


// Standardize extended user access for Type Safety (Era 12 Alignment)
// We use a clean interface here and cast through any to avoid recursive augmentation conflicts
// Standards for Extended User access are now centralized in src/types/next-auth.d.ts




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
                const u = user;
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

                // Force cast through any to bridge recursive augmentation issues in strict mode
                const t = token as any;
                t.id = u.id;
                t.role = u.role;
                t.baseRole = u.baseRole;
                t.tenantId = u.tenantId;
                t.industry = u.industry;
                t.activeModules = u.activeModules;
                t.image = u.image;
                t.tenantAccess = u.tenantAccess;
                t.permissionGroups = u.permissionGroups;
                t.permissionOverrides = u.permissionOverrides;
                t.sessionId = u.sessionId;
                t.mfaVerified = u.mfaVerified === true;
                t.mfaPending = u.mfaPending === true;
                t.preferences = u.preferences;
                t.lastValidated = Date.now();


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
                const sUser = session.user;
                if (sUser.image) token.image = sUser.image;
                if (sUser.name) token.name = sUser.name;
                if (sUser.tenantId) token.tenantId = sUser.tenantId;
                if (sUser.role) token.role = sUser.role;
                if (sUser.industry) token.industry = sUser.industry;
                // Allow updating MFA status from client
                if (typeof sUser.mfaVerified === 'boolean') token.mfaVerified = sUser.mfaVerified;
                if (typeof sUser.mfaPending === 'boolean') token.mfaPending = sUser.mfaPending;
                if (sUser.preferences) {
                    token.preferences = {
                        ...(token.preferences as any || {}),
                        ...sUser.preferences
                    };
                }
            }


            return token;
        },
        async session({ session, token }: { session: Session, token: JWT }) {
            try {
                // Sincronizar campos del token a la sesión (Auditoría P0: Higiene de tipos)
                if (session.user && token) {
                    const u = session.user;
                    const sessionMaskedEmail = u.email ? u.email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + "*".repeat(gp3.length)) : 'unknown';

                    if (process.env.NODE_ENV === 'development') {
                        console.debug(`[AUTH_SYNC] Syncing token for ${sessionMaskedEmail}. mfaVerified: ${token.mfaVerified}`);
                    }

                    // Force cast through any to bridge recursive augmentation issues in strict mode
                    const target = u as any;
                    target.id = token.id;
                    target.role = token.role;
                    target.baseRole = token.baseRole;
                    target.tenantId = token.tenantId;
                    target.industry = token.industry;
                    target.activeModules = token.activeModules || [];

                    target.image = token.image;
                    target.tenantAccess = token.tenantAccess || [];
                    target.permissionGroups = token.permissionGroups || [];
                    target.permissionOverrides = token.permissionOverrides || [];

                    // Explicit propagation of MFA flags and preferences to session user
                    u.mfaVerified = token.mfaVerified === true;
                    u.mfaPending = token.mfaPending === true;
                    u.preferences = token.preferences as any;

                    (session as any).sessionId = token.sessionId as string; // sessionId propagation


                    const sessionSuccessMaskedEmail = u.email ? u.email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + "*".repeat(gp3.length)) : 'unknown';

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
            const user = auth?.user;
            const mfaPending = user?.mfaPending === true;
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
