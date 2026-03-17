
import { applicationLogRepository } from '@/lib/repositories/ApplicationLogRepository';
import { AuditTrailService } from '@/services/observability/AuditTrailService';
import { CorrelationIdService } from '@/services/observability/CorrelationIdService';
import { Filter, Document } from 'mongodb';
import * as zlib from 'zlib';
import { promisify } from 'util';
import { logEvento } from '@/lib/logger';

const gzip = promisify(zlib.gzip);

/**
 * 📝 Log Lifecycle Service
 * Purpose: Management of log retention, archiving, and purging.
 * Hardened Era 8: Repository-based lifecycle management.
 */
export class LogLifecycleService {
    /**
     * Purges operational logs older than a threshold of days.
     */
    static async purgeOldLogs(retentionDays: number = 90): Promise<{ purged: number }> {
        const correlationId = CorrelationIdService.generate();
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - retentionDays);

        const filter: Filter<Document> = { timestamp: { $lt: thresholdDate } };

        // 1. Archive first
        const archived = await this.archiveLogs('application_logs', filter);

        if (archived.count > 0) {
            // 2. Physically delete via repository
            await applicationLogRepository.deleteMany(filter, null, true);

            await AuditTrailService.logAdminOp({
                actorType: 'SYSTEM',
                actorId: 'LOG_LIFECYCLE_JOB',
                tenantId: 'platform_master',
                action: 'PURGE_LOGS',
                entityType: 'SYSTEM',
                entityId: 'application_logs',
                changes: { count: archived.count },
                reason: `Automatic log purge older than ${retentionDays} days`,
                correlationId
            } as any);
        }

        return { purged: archived.count };
    }

    /**
     * Archives logs before deletion (Mocked).
     */
    static async archiveLogs(collectionName: string, filter: Filter<Document>): Promise<{ count: number }> {
        // In a real environment, this would upload to S3/ColdStorage before deletion.
        // Here we mock the count to maintain traceability.

        let records: Document[] = [];
        if (collectionName === 'application_logs') {
            records = await applicationLogRepository.list(filter);
        }

        if (records.length === 0) return { count: 0 };

        try {
            const compressed = await gzip(JSON.stringify(records));

            await logEvento({
                level: 'INFO',
                source: 'LOG_LIFECYCLE',
                action: 'ARCHIVE',
                message: `Archived ${records.length} logs from ${collectionName}`,
                correlationId: 'SYSTEM_MAINTENANCE',
                details: { collection: collectionName, count: records.length, size: compressed.length }
            });

            return { count: records.length };
        } catch (error) {
            console.error('[LogLifecycleService] Error archiving logs:', error);
            // If archiving fails, we return 0 to not delete originals if policy is strict
            return { count: 0 };
        }
    }
}
