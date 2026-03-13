import { connectDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';

/**
 * 🛠️ DbMaintenanceService
 * Handles technical collection maintenance like TTL indexes for ISO 27001 / GDPR compliance.
 */
export class DbMaintenanceService {

    /**
     * Ensures TTL indexes are set correctly for core observability collections.
     */
    static async ensureRetentionPolicies() {
        const db = await connectDB();
        const correlationId = crypto.randomUUID();

        const policies = [
            { collection: 'logs_app', field: 'timestamp', ttlSeconds: 3600 * 24 * 90 }, // 90 days for general logs
            { collection: 'sessions', field: 'expiresAt', ttlSeconds: 0 }, // Expire at exact date
            { collection: 'ragquerylogs', field: 'timestamp', ttlSeconds: 3600 * 24 * 180 }, // 180 days for RAG logs
        ];

        for (const policy of policies) {
            try {
                // Check if collection exists first to avoid unnecessary errors
                const collections = await db.listCollections({ name: policy.collection }).toArray();
                if (collections.length === 0) continue;

                const col = db.collection(policy.collection);

                // Drop existing if we need to update? 
                // For simplicity, we just try to create. MongoDB won't duplicate exact same index.
                await col.createIndex(
                    { [policy.field]: 1 },
                    {
                        expireAfterSeconds: policy.ttlSeconds,
                        name: `ttl_${policy.field}_policy`
                    }
                );

                // ⚡ [PERFORMANCE] Eras 12+ Specialized indexes
                if (policy.collection === 'usage_logs') {
                    await col.createIndex({ tenantId: 1, tipo: 1, timestamp: -1 }, { name: 'perf_tenant_type_time' });
                }
                if (policy.collection === 'application_logs') {
                    await col.createIndex({ tenantId: 1, level: 1, timestamp: -1 }, { name: 'perf_tenant_level_time' });
                    await col.createIndex({ tenantId: 1, action: 1, timestamp: -1 }, { name: 'perf_tenant_action_time' });
                }

                await logEvento({
                    level: 'INFO',
                    source: 'DB_MAINTENANCE',
                    action: 'ENSURE_TTL',
                    message: `TTL policy ensured for ${policy.collection}`,
                    correlationId,
                    details: { policy }
                });
            } catch (err) {
                await logEvento({
                    level: 'ERROR',
                    source: 'DB_MAINTENANCE',
                    action: 'ENSURE_TTL_ERROR',
                    message: `Failed to set TTL for ${policy.collection}`,
                    correlationId,
                    details: { error: String(err), policy }
                });
            }
        }
    }
}
