import { getTenantCollection } from '@/lib/db-tenant';
import { AppEvent } from './schemas/EventSchema';
import { AuditEntry } from './schemas/AuditSchema';
import { type ClientSession } from 'mongodb';

/**
 * 🗄️ Observability Repository
 * Centralized DB access for the LOGS cluster.
 * Rule #11: Multi-tenant Harmony via getTenantCollection.
 */
export class ObservabilityRepository {
    private static readonly LOGS_DB = 'LOGS';

    /**
     * Stores a technical application log.
     */
    static async saveLog(event: AppEvent, session?: ClientSession): Promise<void> {
        const collection = await getTenantCollection<AppEvent>('application_logs', null, this.LOGS_DB);
        await collection.insertOne(event as any, { session });
    }

    /**
     * Stores a business audit entry in the specified collection.
     */
    static async saveAudit(
        collectionName: 'audit_config_changes' | 'audit_admin_ops' | 'audit_data_access' | 'audit_trails' | 'audit_security_events' | 'audit_billing',
        entry: AuditEntry,
        session?: ClientSession
    ): Promise<void> {
        const collection = await getTenantCollection<AuditEntry>(collectionName, null, this.LOGS_DB);
        await collection.insertOne(entry as any, { session });
    }

    /**
     * Aggregates token usage per tenant.
     */
    static async getUsageMetrics(days: number = 7): Promise<Record<string, unknown>[]> {
        const collection = await getTenantCollection<AppEvent>('application_logs', null, this.LOGS_DB);
        const since = new Date();
        since.setDate(since.getDate() - days);

        // Accessing unsecureRawCollection for cross-tenant metrics (System use)
        const raw = (collection as unknown as { unsecureRawCollection: { aggregate: (p: unknown[]) => { toArray: () => Promise<Record<string, unknown>[]> } } }).unsecureRawCollection;

        return await raw.aggregate([
            { $match: { action: 'PROMPT_RUNNER_SUCCESS', timestamp: { $gte: since } } },
            {
                $group: {
                    _id: "$tenantId",
                    totalTokens: { $sum: "$tokenUsage.total" },
                    avgLatency: { $avg: "$durationMs" },
                    requests: { $sum: 1 }
                }
            },
            { $sort: { totalTokens: -1 } }
        ]).toArray();
    }

    /**
     * Aggregates LLM health (Success vs Error).
     */
    static async getLlmHealth(days: number = 7): Promise<Record<string, unknown>[]> {
        const collection = await getTenantCollection<AppEvent>('application_logs', null, this.LOGS_DB);
        const since = new Date();
        since.setDate(since.getDate() - days);

        const raw = (collection as unknown as { unsecureRawCollection: { aggregate: (p: unknown[]) => { toArray: () => Promise<Record<string, unknown>[]> } } }).unsecureRawCollection;

        return await raw.aggregate([
            { $match: { source: 'LLM_CORE', timestamp: { $gte: since } } },
            {
                $group: {
                    _id: "$action",
                    count: { $sum: 1 }
                }
            }
        ]).toArray();
    }

    /**
     * Aggregates SLA metrics for endpoints.
     */
    static async getSlaMetrics(days: number = 7): Promise<Record<string, unknown>[]> {
        const collection = await getTenantCollection<AppEvent>('application_logs', null, this.LOGS_DB);
        const since = new Date();
        since.setDate(since.getDate() - days);

        const raw = (collection as unknown as { unsecureRawCollection: { aggregate: (p: unknown[]) => { toArray: () => Promise<Record<string, unknown>[]> } } }).unsecureRawCollection;

        return await raw.aggregate([
            { $match: { action: 'PERFORMANCE_METRIC', timestamp: { $gte: since }, "details.endpoint": { $exists: true } } },
            {
                $group: {
                    _id: "$details.endpoint",
                    avgDuration: { $avg: "$durationMs" },
                    maxDuration: { $max: "$durationMs" },
                    totalRequests: { $sum: 1 },
                    violations: { $sum: { $cond: [{ $eq: ["$level", "WARN"] }, 1, 0] } }
                }
            },
            { $sort: { violations: -1, maxDuration: -1 } },
            { $limit: 50 }
        ]).toArray();
    }
}
