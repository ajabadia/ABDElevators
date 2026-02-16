import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';

export interface TraceEvent {
    _id: string;
    timestamp: Date;
    level: string;
    message: string;
    source: string;
    action: string;
    correlationId?: string;
    details?: any;
    userEmail?: string;
    traceId?: string;
}

export class TraceService {
    /**
     * Retrieves all logs associated with a specific correlation ID,
     * sorted chronologically to reconstruct the request lifecycle.
     */
    static async getTrace(correlationId: string, session?: any): Promise<TraceEvent[]> {
        if (!correlationId) return [];

        // RULE #11: Use getTenantCollection for isolation
        // We use 'system_logs' via SecureCollection to ensure we only see logs for allowed tenants
        const collection = await getTenantCollection<any>('system_logs', session);

        const logs = await collection.find(
            { correlationId },
            {
                sort: { timestamp: 1 },
                // System logs might not have 'deletedAt', but good practice to includeDeleted if verifying
                includeDeleted: true
            }
        );

        return logs.map(log => ({
            _id: log._id.toString(),
            timestamp: log.timestamp,
            level: log.level,
            message: log.message,
            source: log.source,
            action: log.action,
            correlationId: log.correlationId,
            details: log.details,
            userEmail: log.userEmail,
            traceId: log.traceId
        }));
    }

    /**
     * Finds traces related to a specific user within a time range.
     * Useful for diagnosing "user reported an error 5 mins ago".
     */
    static async findRecentTracesByUser(email: string, session?: any, minutes = 30): Promise<string[]> {
        const collection = await getTenantCollection<any>('system_logs', session);
        const since = new Date(Date.now() - minutes * 60 * 1000);

        const recentLogs = await collection.find(
            {
                userEmail: email,
                timestamp: { $gte: since },
                correlationId: { $exists: true }
            },
            {
                sort: { timestamp: -1 },
                limit: 50
            }
        );

        // Return unique correlation IDs
        return Array.from(new Set(recentLogs.map(l => l.correlationId).filter(Boolean) as string[]));
    }
}
