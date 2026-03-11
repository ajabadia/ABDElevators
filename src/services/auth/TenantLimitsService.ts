import { getTenantCollection } from '@/lib/db-tenant';
import { Redis } from '@upstash/redis';
import { TenantConfig } from '@/lib/schemas';

/**
 * 🚀 TenantLimitsService (Phase 345)
 * Manages per-tenant rate limits and capabilities with Redis caching.
 */
export class TenantLimitsService {
    private static redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL || "",
        token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    });

    /**
     * Get effective rate limits for a tenant.
     * Checks Cache -> DB -> Default Tiers.
     */
    static async getTenantRateLimits(tenantId: string) {
        const cacheKey = `limits:tenant:${tenantId}`;

        try {
            const cached = await this.redis.get<any>(cacheKey);
            if (cached) return cached;
        } catch (e) { }

        const collection = await getTenantCollection('tenant_configs');
        const config = await collection.findOne({ tenantId }) as unknown as TenantConfig;

        if (!config?.rateLimits) {
            return null;
        }

        // Cache for 5 minutes
        try {
            await this.redis.set(cacheKey, config.rateLimits, { ex: 300 });
        } catch (e) { }

        return config.rateLimits;
    }

    /**
     * Clear tenant limits cache
     */
    static async invalidateCache(tenantId: string) {
        try {
            await this.redis.del(`limits:tenant:${tenantId}`);
        } catch (e) { }
    }
}
