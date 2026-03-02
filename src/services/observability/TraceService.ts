import { getTenantCollection, TenantSession } from '@/lib/db-tenant';
import { ClientSession } from 'mongodb';

export interface TraceEvent {
    _id: string;
    timestamp: Date;
    level: string;
    message: string;
    source: string;
    action: string;
    correlationId?: string;
    details?: Record<string, unknown>;
    userEmail?: string;
    traceId?: string;
}

export class TraceService {
    /**
     * Retrieves all logs associated with a specific correlation ID,
     * sorted chronologically to reconstruct the request lifecycle.
     */
    static async getTrace(correlationId: string, session?: TenantSession | ClientSession): Promise<TraceEvent[]> {
        if (!correlationId) return [];

        // RULE #11: Use getTenantCollection for isolation
        const collection = await getTenantCollection<Record<string, unknown>>('system_logs', session as any);

        const logs = await collection.find(
            { correlationId },
            {
                sort: { timestamp: 1 },
                includeDeleted: true
            }
        );

        return logs.map(log => ({
            _id: log._id.toString(),
            timestamp: log.timestamp as Date,
            level: log.level as string,
            message: log.message as string,
            source: log.source as string,
            action: log.action as string,
            correlationId: log.correlationId as string | undefined,
            details: log.details as Record<string, unknown> | undefined,
            userEmail: log.userEmail as string | undefined,
            traceId: log.traceId as string | undefined
        }));
    }

    /**
     * Finds traces related to a specific user within a time range.
     * Useful for diagnosing "user reported an error 5 mins ago".
     */
    static async findRecentTracesByUser(email: string, session?: TenantSession | ClientSession, minutes = 30): Promise<string[]> {
        const collection = await getTenantCollection<Record<string, unknown>>('system_logs', session as any);
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
