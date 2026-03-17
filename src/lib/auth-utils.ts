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
import { IndustryType, EntityIdSchema } from "@/lib/schemas";
import { MongoSanitizer } from "./mongo-sanitizer";
import { CorrelationIdService } from "@/services/observability/CorrelationIdService";
import { Db } from "mongodb";

/**
 * Interface para el usuario recuperado de la DB durante auth.
 */
interface AuthUser {
    _id: any; // MongoDB ObjectId
    email: string;
    password: string;
    role: UserRole;
    tenantId?: string;
    industry?: IndustryType;
    activeModules?: string[];
    tenantAccess?: any[];
    permissionGroups?: string[];
    permissionOverrides?: string[];
    preferences?: { uxMode?: 'simple' | 'expert', [key: string]: any };
    firstName?: string;
    lastName?: string;
}

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
 * Helper to mask emails for logging.
 */
function maskEmail(email?: string): string {
    if (!email) return 'unknown';
    return email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + "*".repeat(gp3.length));
}

/**
 * Helper to mask User IDs for logging.
 */
function maskUserId(userId?: string): string {
    if (!userId) return 'unknown';
    return userId.substring(0, 4) + '***' + userId.substring(userId.length - 4);
}

/**
 * 1. Find user in Auth DB with fallback to Main DB.
 */
async function findUserForAuth(email: string, correlationId: string) {
    let db = await connectAuthDB();
    let user = await db.collection("users").findOne(MongoSanitizer.sanitizeQuerySync({ email }));

    if (!user) {
        // Non-blocking telemetry
        logEvento({
            level: 'DEBUG',
            source: 'AUTH_UTILS',
            action: 'DB_FALLBACK',
            message: `User not found in Auth DB. Trying Main DB for ${maskEmail(email)}`,
            correlationId
        });
        const mainDb = await connectDB();
        user = await mainDb.collection("users").findOne(MongoSanitizer.sanitizeQuerySync({ email }));
        if (user) db = mainDb;
    }

    return { user, db };
}

/**
 * 2. Validate Magic Link token.
 */
async function validateMagicLink(db: Db, email: string, token: string, ip: string, correlationId: string) {
    const result = await db.collection('magic_links').findOneAndUpdate(
        MongoSanitizer.sanitizeQuerySync({ email, token, used: { $ne: true }, expiresAt: { $gt: new Date() } }),
        { $set: { used: true, usedAt: new Date(), lastUsedIp: ip } },
        { returnDocument: 'after' }
    );

    const magicLink = result as { used: boolean } | null;
    if (!magicLink || magicLink.used !== true) {
        await logEvento({
            level: 'WARN',
            source: 'AUTH_UTILS',
            action: 'MAGIC_LINK_INVALID',
            message: `Magic Link invalid or expired for ${maskEmail(email)}`,
            correlationId
        });
        throw new InvalidMagicLinkError();
    }
}

/**
 * 3. Validate MFA if enabled.
 */
async function validateMfa(userId: string, email: string, mfaCodeInput: unknown, correlationId: string) {
    const mfaEnabled = await MfaService.isEnabled(EntityIdSchema.parse(userId));
    if (!mfaEnabled) return;

    const mfaCode = typeof mfaCodeInput === 'string' ? mfaCodeInput.trim() : undefined;
    const isInvalidCodeValue = !mfaCode || mfaCode === "undefined" || mfaCode === "null" || mfaCode === "";

    if (isInvalidCodeValue) {
        // Non-blocking telemetry
        logEvento({
            level: 'INFO',
            source: 'AUTH_UTILS',
            action: 'MFA_REQUIRED',
            message: `MFA required for ${maskEmail(email)}`,
            correlationId
        });
        throw new MfaRequiredError();
    }

    const mfaValid = await MfaService.verify(EntityIdSchema.parse(userId), mfaCode);
    if (!mfaValid) {
        await logEvento({
            level: 'WARN',
            source: 'AUTH_UTILS',
            action: 'MFA_INVALID',
            message: `Invalid MFA code for ${maskEmail(email)}`,
            correlationId
        });
        throw new InvalidMfaCodeError();
    }
}

/**
 * 4. Create session and return user object.
 */
async function finalizeSession(user: AuthUser, tenantId: string, ip: string, ua: string, correlationId: string) {
    const userId = (user._id as object).toString();
    const sessionId = await SessionService.createSession({
        userId,
        email: user.email as string,
        tenantId,
        ip,
        userAgent: ua
    });

    // Non-blocking telemetry
    logEvento({
        level: 'INFO',
        source: 'AUTH_UTILS',
        action: 'SESSION_CREATED',
        message: `Session created for ${maskEmail(user.email)}`,
        correlationId,
        details: { userId: maskUserId(userId), tenantId }
    });

    return {
        id: userId,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        role: user.role,
        baseRole: user.role,
        tenantId,
        industry: user.industry as IndustryType,
        activeModules: user.activeModules || [],
        tenantAccess: user.tenantAccess || [],
        permissionGroups: user.permissionGroups || [],
        permissionOverrides: user.permissionOverrides || [],
        mfaVerified: true,
        mfaPending: false,
        preferences: user.preferences || { uxMode: 'simple' },
        sessionId
    };
}
/**
 * Lógica centralizada de validación de credenciales (MFA, Magic Link, etc.)
 * Extraída para facilitar testing aislado.
 */
export async function authorizeCredentials(
    credentials: Partial<Record<"email" | "password" | "mfaCode", unknown>>,
    req?: Request | NextRequest
) {
    const correlationId = CorrelationIdService.generate();
    const email = (credentials?.email as string)?.toLowerCase().trim();

    // Non-blocking telemetry
    logEvento({
        level: 'INFO',
        source: 'AUTH_UTILS',
        action: 'AUTHORIZE_START',
        message: `Authorize START for ${maskEmail(email)}`,
        correlationId
    });

    try {
        if (!email || !credentials?.password) return null;
        const password = credentials.password as string;

        const { user, db } = await findUserForAuth(email, correlationId);
        if (!user) {
            await logEvento({ level: 'ERROR', source: 'AUTH_UTILS', action: 'USER_NOT_FOUND', message: `User not found: ${maskEmail(email)}`, correlationId });
            throw new UserNotFoundError();
        }

        const authUser = user as unknown as AuthUser;

        const ip = await (async () => {
            try {
                if (req?.headers) {
                    const forward = req.headers.get("x-forwarded-for");
                    if (forward) return forward.split(',')[0].trim();
                }
                const h = await headers();
                return h.get("x-forwarded-for")?.split(',')[0] ?? "127.0.0.1";
            } catch { return "127.0.0.1"; }
        })();

        const ua = await (async () => {
            try {
                if (req?.headers) return req.headers.get("user-agent") ?? "Unknown";
                const h = await headers();
                return h.get("user-agent") ?? "Unknown";
            } catch { return "Unknown"; }
        })();

        const effectiveTenantId = user.tenantId || process.env.SINGLE_TENANT_ID || 'abd_global';

        // MAGIC LINK FLOW
        if (password.startsWith('MAGIC_LINK:')) {
            const token = password.replace('MAGIC_LINK:', '');
            await validateMagicLink(db as unknown as Db, email, token, ip, correlationId);
            await validateMfa(authUser._id.toString(), email, credentials.mfaCode, correlationId);
            return await finalizeSession(authUser, effectiveTenantId, ip, ua, correlationId);
        }

        // STANDARD FLOW
        const isValidPassword = await bcrypt.compare(password, authUser.password);
        if (!isValidPassword) {
            await logEvento({ level: 'WARN', source: 'AUTH_UTILS', action: 'INVALID_PASSWORD', message: `Invalid password for ${maskEmail(email)}`, correlationId });
            throw new InvalidPasswordError();
        }

        await validateMfa(authUser._id.toString(), email, credentials.mfaCode, correlationId);
        return await finalizeSession(authUser, effectiveTenantId, ip, ua, correlationId);

    } catch (error: unknown) {
        if (error instanceof CredentialsSignin || (error && typeof error === 'object' && 'code' in error)) {
            throw error;
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        await logEvento({
            level: 'ERROR',
            source: 'AUTH_UTILS',
            action: 'UNHANDLED_ERROR',
            message: `Critical Error: ${errorMessage}`,
            correlationId,
            details: { stack: (error as Error).stack }
        });
        return null;
    }
}
