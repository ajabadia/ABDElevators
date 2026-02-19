import { Document } from 'mongodb';
import { getTenantCollection, TenantSession } from './db-tenant';
import { logEvento } from './logger';
import {
    FeatureFlagType,
    FeatureFlagConfig,
    FeatureFlagConfigSchema,
    DEFAULT_PLATFORM_FLAGS
} from '../types/feature-flags';
import { AppError } from '../errors';

/**
 * FeatureFlagService
 * Manages tenant-specific feature flags and module licenses.
 */
export class FeatureFlagService {
    private static cache: Map<string, { config: FeatureFlagConfig, expires: number }> = new Map();
    private static CACHE_TTL = 300000; // 5 minutes

    /**
     * Check if a feature is enabled for a specific tenant.
     * SLA: P95 < 50ms (from cache)
     */
    static async isEnabled(session: TenantSession, flag: FeatureFlagType): Promise<boolean> {
        const tenantId = session.user?.tenantId || 'platform_master';

        // 1. Check environment override (Precedence 1)
        const envKey = `FEATURE_${flag}`;
        if (process.env[envKey] === 'true') return true;
        if (process.env[envKey] === 'false') return false;

        // 2. Check Cache
        const cached = this.cache.get(tenantId);
        if (cached && cached.expires > Date.now()) {
            return cached.config.flags[flag] ?? DEFAULT_PLATFORM_FLAGS[flag] ?? false;
        }

        // 3. Fetch from DB (Precedence 2)
        try {
            const config = await this.getTenantConfig(session);

            // Update Cache
            this.cache.set(tenantId, {
                config,
                expires: Date.now() + this.CACHE_TTL
            });

            return config.flags[flag] ?? DEFAULT_PLATFORM_FLAGS[flag] ?? false;
        } catch (error) {
            // Fallback to defaults on DB error
            console.error(`[FEATURE_FLAG_SERVICE] DB fetch failed for ${tenantId}:`, error);
            return DEFAULT_PLATFORM_FLAGS[flag] ?? false;
        }
    }

    /**
     * Get the full configuration for a tenant.
     */
    static async getTenantConfig(session: TenantSession): Promise<FeatureFlagConfig> {
        const tenantId = session.user?.tenantId || 'platform_master';
        const collection = await getTenantCollection<Document>('feature_flags', session, 'LOGS');

        const doc = await collection.findOne({ tenantId });

        if (!doc) {
            // Return virtual default config if not found
            return {
                tenantId,
                flags: DEFAULT_PLATFORM_FLAGS,
                modules: {}
            };
        }

        return FeatureFlagConfigSchema.parse(doc);
    }

    /**
     * Update feature flags for a tenant (SUPER_ADMIN only).
     */
    static async updateTenantFlags(
        session: TenantSession,
        targetTenantId: string,
        updates: Partial<Record<string, boolean>>
    ): Promise<void> {
        if (session.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('FORBIDDEN', 403, 'Solo SUPER_ADMIN puede gestionar flags globales');
        }

        const collection = await getTenantCollection<Document>('feature_flags', session, 'LOGS');

        const currentBatch = await collection.findOne({ tenantId: targetTenantId });
        const newFlags = {
            ...(currentBatch?.flags || DEFAULT_PLATFORM_FLAGS),
            ...updates
        };

        await collection.updateOne(
            { tenantId: targetTenantId },
            {
                $set: {
                    flags: newFlags,
                    updatedAt: new Date(),
                    updatedBy: session.user.id
                }
            },
            { upsert: true }
        );

        // Invalidate Cache
        this.cache.delete(targetTenantId);

        await logEvento({
            level: 'WARN',
            source: 'FEATURE_FLAG_SERVICE',
            action: 'UPDATE_FLAGS',
            message: `Feature flags updated for tenant ${targetTenantId}`,
            tenantId: session.user.tenantId,
            correlationId: `ff-update-${Date.now()}`,
            details: { targetTenantId, updates }
        });
    }

    /**
     * Clear the service cache (e.g. during system maintenance).
     */
    static clearCache(): void {
        this.cache.clear();
    }
}
