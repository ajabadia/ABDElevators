import { CredentialsSignin } from "next-auth";
import { NextRequest } from "next/server";
import { connectAuthDB, connectDB } from "./db";
import bcrypt from "bcryptjs";
import { logEvento } from "./logger";
import { SessionService } from "@/services/auth/SessionService";
import { MfaService } from "@/services/auth/MfaService";
import { headers } from "next/headers";
import { UserRole } from "@/types/roles";
import { FeatureFlags } from "@/services/security/feature-flags";
import { IndustryType } from "@/lib/schemas";

// Custom error classes for NextAuth v5 (Preserve codes in client)
export class MfaRequiredError extends CredentialsSignin {
    code = "MFA_REQUIRED";
}

export class InvalidMfaCodeError extends CredentialsSignin {
    code = "INVALID_MFA_CODE";
}

export class InvalidMagicLinkError extends CredentialsSignin {
    code = "INVALID_MAGIC_LINK";
}

export class UserNotFoundError extends CredentialsSignin {
    code = "USER_NOT_FOUND";
}

export class InvalidPasswordError extends CredentialsSignin {
    code = "INVALID_PASSWORD";
}

/**
 * Lógica centralizada de validación de credenciales (MFA, Magic Link, etc.)
 * Extraída para facilitar testing aislado.
 */
export async function authorizeCredentials(
    credentials: Partial<Record<"email" | "password" | "mfaCode", unknown>>,
    req?: Request | NextRequest
) {
    const correlationId = typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Date.now().toString();

    logEvento({ level: 'INFO', source: 'AUTH_UTILS', action: 'AUTHORIZE_START', message: `Authorize START | Email: ${credentials?.email}`, correlationId });

    console.log(`➡️ [AUTH_UTILS] Authorize START | CorrelationId: ${correlationId}`);

    const getIp = async () => {
        try {
            if (req?.headers) {
                const forward = req.headers.get("x-forwarded-for");
                if (forward) return forward.split(',')[0].trim();
            }
            const h = await headers();
            return h.get("x-forwarded-for")?.split(',')[0] ?? "127.0.0.1";
        } catch (e) {
            return "127.0.0.1";
        }
    };

    const getUA = async () => {
        try {
            if (req?.headers) return req.headers.get("user-agent") ?? "Unknown";
            const h = await headers();
            return h.get("user-agent") ?? "Unknown";
        } catch (e) {
            return "Unknown";
        }
    };

    try {
        if (!credentials?.email || !credentials?.password) {
            console.warn("⚠️ [AUTH ATTEMPT] Missing credentials");
            return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        console.log(`🔍 [AUTH_UTILS] Checking DB for user: ${email}`);

        // DUAL DB STRATEGY: Try Auth DB first, fallback to Main DB
        let db = await connectAuthDB();
        let user = await db.collection("users").findOne({ email });

        if (!user) {
            console.log(`🔎 [AUTH_UTILS] User not found in Auth DB. Trying Main DB...`);
            const mainDb = await connectDB();
            user = await mainDb.collection("users").findOne({ email });
            if (user) {
                console.log(`✅ [AUTH_UTILS] User FOUND in Main DB: ${email}`);
                db = mainDb; // Use this DB for subsequent checks in this flow
            }
        }

        if (!user) {
            console.log(`❌ User not found in ANY DB: ${email}`);
            console.error("❌ [AUTH_UTILS] User not found in ANY DB:", email);
            throw new UserNotFoundError();
        }

        console.log(`✅ User found in DB: ${email} | Host: ${db.databaseName}`);

        // 🛠️ MAGIC LINK LOGIC
        if (password.startsWith('MAGIC_LINK:')) {
            const tokenString = password.replace('MAGIC_LINK:', '');
            console.log(`🔗 [AUTH_UTILS] Magic Link Attempt for ${email}`);

            const result = await db.collection('magic_links').findOneAndUpdate(
                {
                    email: email,
                    token: tokenString,
                    used: { $ne: true },
                    expiresAt: { $gt: new Date() }
                },
                {
                    $set: {
                        used: true,
                        usedAt: new Date(),
                        lastUsedIp: await getIp()
                    }
                },
                { returnDocument: 'after' }
            );

            const magicLink = result as unknown as { used: boolean };
            if (!magicLink || magicLink.used !== true) {
                console.warn(`🛑 [AUTH_UTILS] Magic Link invalid/expired for ${email}`);
                throw new InvalidMagicLinkError();
            }

            console.log(`✅ [AUTH_UTILS] Magic Link success for ${email}`);
            console.log(`[AUTH_TRACE] ✅ Magic Link success for ${email}`);

            // NEW: After Magic Link, check if user has MFA enabled (Phase 120.1 Consistency)
            const userId = user._id.toString();
            const mfaEnabled = await MfaService.isEnabled(userId);
            const effectiveTenantId = user.tenantId || process.env.SINGLE_TENANT_ID || 'abd_global';

            console.log(`[AUTH_TRACE] 🔎 Magic Link MFA check for ${email}: ${mfaEnabled} | Tenant: ${effectiveTenantId}`);

            if (mfaEnabled) {
                console.log(`[AUTH_TRACE] 🎟️ MFA Required after Magic Link for ${email}. Throwing MfaRequiredError.`);
                // Return minimal user data in the error if possible, but NextAuth v5 CredentialsSignin
                // doesn't easily support passing data back. The client should know based on the code.
                throw new MfaRequiredError();
            }

            console.log(`[AUTH_TRACE] 🧪 Finalizing session for Magic Link: ${email}...`);
            return {
                id: userId,
                email: user.email,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
                role: user.role,
                baseRole: user.role,
                tenantId: effectiveTenantId,
                industry: user.industry as IndustryType,
                activeModules: user.activeModules || [],
                tenantAccess: user.tenantAccess || [],
                permissionGroups: user.permissionGroups || [],
                permissionOverrides: user.permissionOverrides || [],
                mfaVerified: true,
                mfaPending: false,
                sessionId: await SessionService.createSession({
                    userId: userId,
                    email: user.email,
                    tenantId: effectiveTenantId,
                    ip: await getIp(),
                    userAgent: await getUA()
                })
            };
        }

        // 🛠️ STANDAR LOGIN LOGIC
        console.log(`[AUTH_TRACE] ⚖️ Verifying password for ${email}...`);
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            console.log(`[AUTH_TRACE] ❌ Invalid password for ${email}`);
            console.error("❌ [AUTH_UTILS] Invalid password for:", email);
            throw new InvalidPasswordError();
        }

        const userId = user._id.toString();
        const mfaEnabled = await MfaService.isEnabled(userId);
        const effectiveTenantId = user.tenantId || process.env.SINGLE_TENANT_ID || 'abd_global';
        console.log(`[AUTH_TRACE] 🔎 MFA Enabled: ${mfaEnabled} for ${email} | Tenant: ${effectiveTenantId}`);

        if (mfaEnabled) {
            const mfaCodeInput = credentials.mfaCode;
            const mfaCode = typeof mfaCodeInput === 'string' ? mfaCodeInput.trim() : undefined;
            const isInvalidCodeValue = !mfaCode || mfaCode === "undefined" || mfaCode === "null" || mfaCode === "";

            console.log(`[AUTH_TRACE] 🔎 MFA Check | InputType: ${typeof mfaCodeInput} | Value: [${mfaCode}] | IsInvalid: ${isInvalidCodeValue}`);

            if (isInvalidCodeValue) {
                console.log(`[AUTH_TRACE] 🎟️ MFA Required for ${email}. Throwing MfaRequiredError.`);
                throw new MfaRequiredError();
            }

            console.log(`🧪 [AUTH_UTILS] Verifying MFA code for ${email}...`);
            const mfaValid = await MfaService.verify(userId, mfaCode);
            if (!mfaValid) {
                console.warn(`🛑 [AUTH_UTILS] Invalid MFA code for ${email}`);
                throw new InvalidMfaCodeError();
            }
            console.log(`✅ [AUTH_UTILS] MFA Verified for ${email}`);
        }

        console.log(`🧪 [AUTH_UTILS] Finalizing session for ${email}...`);
        const sessionId = await SessionService.createSession({
            userId,
            email: user.email,
            tenantId: effectiveTenantId,
            ip: await getIp(),
            userAgent: await getUA()
        });

        return {
            id: userId,
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            role: user.role,
            baseRole: user.role,
            tenantId: effectiveTenantId,
            industry: user.industry as IndustryType,
            activeModules: user.activeModules || [],
            tenantAccess: user.tenantAccess || [],
            permissionGroups: user.permissionGroups || [],
            permissionOverrides: user.permissionOverrides || [],
            mfaVerified: true,
            mfaPending: false,
            sessionId
        };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorCode = (error as { code?: string })?.code;
        console.log(`[AUTH_TRACE] 💥 CAUGHT ERROR: ${errorMessage} | Code: ${errorCode}`);
        // Robust re-throw: check both for instance and for existence of 'code' property
        if (error instanceof CredentialsSignin || (error && typeof error === 'object' && 'code' in error)) {
            console.log(`[AUTH_TRACE] 🛑 Handled Auth Error Re-thrown: ${errorCode}`);
            throw error;
        }
        console.error("💥 [AUTH_UTILS] UNHANDLED CRITICAL ERROR:", errorMessage, (error as Error).stack);
        // Important: Still return null to prevent crashes, but log the hell out of it.
        return null;
    }
}
