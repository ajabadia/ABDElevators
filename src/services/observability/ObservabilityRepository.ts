import { getTenantCollection } from '@/lib/db-tenant';
import { AppEvent } from './schemas/EventSchema';
import { AuditEntry } from './schemas/AuditSchema';
import { RAGQueryLog } from './schemas/RAGQueryLogSchema';
import { WorkflowExecution } from './schemas/WorkflowExecutionSchema';
import { type ClientSession } from 'mongodb';

/**
 * 🗄️ Observability Repository
 * Centralized DB access for the LOGS cluster.
 * Rule #11: Multi-tenant Harmony via getTenantCollection.
 */
export class ObservabilityRepository {
    private static readonly LOGS_DB = 'LOGS';

    /**
     * System session for multi-tenant guard bypass (SuperAdmin scope)
     */
    private static getSystemSession() {
        return {
            user: {
                id: '000000000000000000000000',
                tenantId: '000000000000000000000000',
                role: 'SUPER_ADMIN'
            }
        };
    }

    /**
     * Stores a technical application log.
     */
    static async saveLog(event: AppEvent, session?: ClientSession): Promise<void> {
        const collection = await getTenantCollection<AppEvent>('application_logs', this.getSystemSession(), this.LOGS_DB);
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
        const collection = await getTenantCollection<AuditEntry>(collectionName, this.getSystemSession(), this.LOGS_DB);
        await collection.insertOne(entry as any, { session });
    }

    /**
     * 🌊 ERA 12: Stores a RAG Query Log.
     */
    static async saveRAGQueryLog(log: RAGQueryLog, session?: ClientSession): Promise<void> {
        const collection = await getTenantCollection<RAGQueryLog>('rag_query_logs', this.getSystemSession(), this.LOGS_DB);
        await collection.insertOne(log as any, { session });
    }

    /**
     * 🌊 ERA 12: Stores a Workflow Execution Log.
     */
    static async saveWorkflowExecution(execution: WorkflowExecution, session?: ClientSession): Promise<void> {
        const collection = await getTenantCollection<WorkflowExecution>('workflow_executions', this.getSystemSession(), this.LOGS_DB);
        await collection.insertOne(execution as any, { session });
    }

    /**
     * Aggregates token usage per tenant.
     */
    static async getUsageMetrics(days: number = 7): Promise<Record<string, unknown>[]> {
        const collection = await getTenantCollection<AppEvent>('application_logs', this.getSystemSession(), this.LOGS_DB);
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
        const collection = await getTenantCollection<AppEvent>('application_logs', this.getSystemSession(), this.LOGS_DB);
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
        const collection = await getTenantCollection<AppEvent>('application_logs', this.getSystemSession(), this.LOGS_DB);
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

    /**
     * Retrieves application logs with optional limit.
     */
    static async getLogs(options: { limit?: number } = {}): Promise<AppEvent[]> {
        const collection = await getTenantCollection<AppEvent>('application_logs', this.getSystemSession(), this.LOGS_DB);
        return await collection.find({}, {
            sort: { timestamp: -1 } as any,
            limit: options.limit || 100
        });
    }

    /**
     * Aggregates log stats (errors, warnings).
     */
    static async getLogStats(): Promise<{ errorCount: number; warnCount: number }> {
        const collection = await getTenantCollection<AppEvent>('application_logs', this.getSystemSession(), this.LOGS_DB);
        const errorCount = await collection.countDocuments({ level: 'ERROR' } as any);
        const warnCount = await collection.countDocuments({ level: 'WARN' } as any);
        return { errorCount, warnCount };
    }

    /**
     * Aggregates global system health stats.
     */
    static async getGlobalStats(): Promise<Record<string, unknown>> {
        const collection = await getTenantCollection<AppEvent>('application_logs', this.getSystemSession(), this.LOGS_DB);
        const since = new Date();
        since.setHours(since.getHours() - 24);

        const total24h = await collection.countDocuments({ timestamp: { $gte: since } } as any);
        return { total24h };
    }

    /**
     * 🛡️ Phase 440: Aggregates P95 metrics in a short time window.
     */
    static async getRecentP95Metrics(windowMinutes: number = 5): Promise<Record<string, unknown>[]> {
        const collection = await getTenantCollection<AppEvent>('application_logs', this.getSystemSession(), this.LOGS_DB);
        const since = new Date();
        since.setMinutes(since.getMinutes() - windowMinutes);

        const raw = (collection as unknown as { unsecureRawCollection: { aggregate: (p: unknown[]) => { toArray: () => Promise<Record<string, unknown>[]> } } }).unsecureRawCollection;

        return await raw.aggregate([
            { $match: { action: 'PERFORMANCE_METRIC', timestamp: { $gte: since } } },
            {
                $group: {
                    _id: "$details.endpoint",
                    p95: { $percentile: { input: "$durationMs", p: [0.95], method: "approximate" } },
                    count: { $sum: 1 }
                }
            },
            { $unwind: "$p95" }
        ]).toArray();
    }

    /**
     * 🛡️ Phase 440: Detects security anomalies (Failed logins peak).
     */
    static async getRecentAnomalies(windowMinutes: number = 10): Promise<Record<string, unknown>[]> {
        const collection = await getTenantCollection<AppEvent>('application_logs', this.getSystemSession(), this.LOGS_DB);
        const since = new Date();
        since.setMinutes(since.getMinutes() - windowMinutes);

        const raw = (collection as unknown as { unsecureRawCollection: { aggregate: (p: unknown[]) => { toArray: () => Promise<Record<string, unknown>[]> } } }).unsecureRawCollection;

        return await raw.aggregate([
            { $match: { level: 'ERROR', timestamp: { $gte: since } } },
            {
                $group: {
                    _id: "$action",
                    count: { $sum: 1 },
                    lastEvent: { $first: "$$ROOT" }
                }
            },
            { $match: { count: { $gt: 5 } } } // Threshold for anomaly
        ]).toArray();
    }
}
