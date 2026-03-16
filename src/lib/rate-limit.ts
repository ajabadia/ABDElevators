import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Global Redis Client for Rate Limiting
 * Uses HTTP-based connection compatible with Vercel Edge Runtime.
 */
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || "https://global.upstash.io",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "token",
});

// Cache limiters to prevent re-initialization
const limiters = new Map<string, Ratelimit>();

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

/**
 * Standardized Rate Limits
 */
export const LIMITS = {
    AUTH: { limit: 500, window: "5 m" as const },      // 500 attempts per 5 minutes (Relaxed for dev)
    ADMIN: { limit: 1000, window: "1 m" as const },    // 1000 req/min (Admin actions)
    PUBLIC: { limit: 600, window: "1 m" as const },    // 600 req/min (Public endpoints)
    SANDBOX: { limit: 50, window: "1 m" as const },    // 50 req/min (Strict Public Demo)
    CORE: { limit: 3000, window: "1 m" as const },     // 3000 req/min (Authorized App usage)
};

/**
 * Check Rate Limit
 * @param identifier - Unique ID (IP address, User ID, Agent ID)
 * @param config - Rate limit configuration { limit, window }
 * @param tenantId - Optional Tenant ID for grouped throttling (Phase 345)
 * @returns RateLimitResult
 */
export async function checkRateLimit(
    identifier: string,
    config: { limit: number, window: "1 s" | "10 s" | "1 m" | "5 m" | "1 h" | string } = LIMITS.CORE,
    tenantId?: string
): Promise<RateLimitResult> {

    // Fail Open if Env variables are missing
    const isMisconfigured = !process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL === "https://global.upstash.io";

    if (isMisconfigured) {
        if (process.env.NODE_ENV === 'production') {
            console.warn("⚠️ Rate Limiting Disabled: UPSTASH_REDIS_REST_URL not configured correctly.");
        }
        return { success: true, limit: config.limit, remaining: config.limit, reset: Date.now() };
    }

    // Build hierarchical key: abdelevators:ratelimit:[tenantId]:[configKey]:[identifier]
    const tenantPrefix = tenantId ? `${tenantId}:` : "";
    let finalConfig = config;

    // Phase 345: Fetch Tenant Overrides from Redis
    if (tenantId) {
        try {
            const tenantLimits = await redis.get<any>(`limits:tenant:${tenantId}`);
            if (tenantLimits?.overrides && tenantLimits.overrides[config.window]) {
                finalConfig = {
                    limit: tenantLimits.overrides[config.window].limit,
                    window: config.window
                };
            }
        } catch (e) {
            // Silently fall back to default config if Redis lookup fails
        }
    }

    const configKey = `${finalConfig.limit}:${finalConfig.window}`;
    const cacheKey = `limiter:${configKey}`;

    if (!limiters.has(cacheKey)) {
        limiters.set(cacheKey, new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(finalConfig.limit, finalConfig.window as any),
            analytics: true,
            prefix: "abdelevators:ratelimit",
        }));
    }

    const limiter = limiters.get(cacheKey)!;

    try {
        // Compound identifier for per-tenant + per-user isolation
        const compoundId = `${tenantPrefix}${identifier}`;
        const { success, limit, remaining, reset } = await limiter.limit(compoundId);
        return { success, limit, remaining, reset };
    } catch (error: any) {
        const isQuotaError = error?.message?.includes('max requests limit exceeded');
        if (isQuotaError) {
            console.warn(`[RATE_LIMIT] ⚠️ Quota exceeded for compoundId: ${tenantPrefix}${identifier.substring(0, 5)}... Fail Open enabled.`);
        } else {
            console.error("Rate Limit Error (Fail Open):", error);
        }
        return { success: true, limit: finalConfig.limit, remaining: finalConfig.limit, reset: Date.now() };
    }
}
