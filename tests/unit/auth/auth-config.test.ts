import { authConfig } from "@/lib/auth.config";
import { NextRequest } from "next/server";

describe("NextAuth Config Callbacks", () => {
    describe("jwt callback", () => {
        it("should populate token with user data on initial sign in", async () => {
            const token: any = {};
            const user: any = {
                id: "user_123",
                email: "test@example.com",
                role: "ADMIN",
                tenantId: "tenant_abc",
                industry: "ELEVATORS",
                activeModules: ["MFA"]
            };

            const result: any = await authConfig.callbacks.jwt!({
                token,
                user,
                trigger: 'signIn',
                account: null,
                profile: undefined,
                session: undefined
            } as any);

            expect(result.role).toBe("ADMIN");
            expect(result.tenantId).toBe("tenant_abc");
            expect(result.sub).toBe("user_123");
        });

        it("should handle session updates", async () => {
            const token: any = { role: "ADMIN" };
            const session: any = { user: { role: "USER" } };

            const result: any = await authConfig.callbacks.jwt!({
                token,
                user: {} as any,
                trigger: 'update',
                session,
                account: null,
                profile: undefined
            } as any);

            expect(result.role).toBe("USER");
        });
    });

    describe("session callback", () => {
        it("should propagate token data to session user", async () => {
            const session: any = { user: {} };
            const token: any = {
                role: "ADMIN",
                tenantId: "tenant_abc",
                mfaVerified: true
            };

            const result: any = await authConfig.callbacks.session!({
                session,
                token,
                user: {} as any,
                newSession: undefined,
                trigger: undefined
            } as any);

            expect(result.user.role).toBe("ADMIN");
            expect(result.user.tenantId).toBe("tenant_abc");
            expect(result.user.mfaVerified).toBe(true);
        });
    });

    describe("authorized callback", () => {
        it("should allow public routes without auth", async () => {
            const auth: any = null;
            const request = {
                nextUrl: { pathname: "/login" }
            } as any;

            const result = await authConfig.callbacks.authorized!({ auth, request } as any);
            expect(result).toBe(true);
        });

        it("should block protected routes if not authenticated", async () => {
            const auth: any = null;
            const request = {
                nextUrl: { pathname: "/admin" }
            } as any;

            const result = await authConfig.callbacks.authorized!({ auth, request } as any);
            expect(result).toBe(false);
        });

        it("should block protected routes if MFA is pending", async () => {
            const auth: any = { user: { mfaPending: true } };
            const request = {
                nextUrl: { pathname: "/admin" }
            } as any;

            const result = await authConfig.callbacks.authorized!({ auth, request } as any);
            expect(result).toBe(false);
        });

        it("should allow protected routes if fully authenticated", async () => {
            const auth: any = { user: { mfaPending: false, role: "ADMIN" } };
            const request = {
                nextUrl: { pathname: "/admin" }
            } as any;

            const result = await authConfig.callbacks.authorized!({ auth, request } as any);
            expect(result).toBe(true);
        });
    });
});
