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
    AUTH: { limit: 50, window: "5 m" as const },      // 50 attempts per 5 minutes (Relaxed from 10)
    ADMIN: { limit: 100, window: "1 m" as const },    // 100 req/min (Admin actions)
    PUBLIC: { limit: 60, window: "1 m" as const },    // 60 req/min (Public endpoints)
    SANDBOX: { limit: 5, window: "1 m" as const },    // 5 req/min (Strict Public Demo)
    CORE: { limit: 300, window: "1 m" as const },     // 300 req/min (Authorized App usage)
};

/**
 * Check Rate Limit
 * @param identifier - Unique ID (IP address, User ID, etc.)
 * @param config - Rate limit configuration { limit, window }
 * @returns RateLimitResult
 */
export async function checkRateLimit(
    identifier: string,
    config: { limit: number, window: "1 s" | "10 s" | "1 m" | "5 m" | "1 h" | string } = LIMITS.CORE
): Promise<RateLimitResult> {

    // Fail Open if Env variables are missing (Dev mode or Misconfiguration)
    // Checks if URL looks like the default placeholder or is empty
    const isMisconfigured = !process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL === "https://global.upstash.io";

    if (isMisconfigured) {
        // Only warn in production to avoid noise in dev if not set up
        if (process.env.NODE_ENV === 'production') {
            console.warn("⚠️ Rate Limiting Disabled: UPSTASH_REDIS_REST_URL not configured correctly.");
        }
        return { success: true, limit: config.limit, remaining: config.limit, reset: Date.now() };
    }

    const key = `limit:${config.limit}:${config.window}`;

    if (!limiters.has(key)) {
        limiters.set(key, new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(config.limit, config.window as any),
            analytics: true,
            prefix: "abdelevators:ratelimit",
        }));
    }

    const limiter = limiters.get(key)!;

    try {
        const { success, limit, remaining, reset } = await limiter.limit(identifier);
        return { success, limit, remaining, reset };
    } catch (error) {
        console.error("Rate Limit Error (Fail Open):", error);
        return { success: true, limit: config.limit, remaining: config.limit, reset: Date.now() };
    }
}
