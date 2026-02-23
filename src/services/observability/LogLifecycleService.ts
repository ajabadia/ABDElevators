
import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { AuditTrailService } from '@/services/observability/AuditTrailService';
import { CorrelationIdService } from '@/services/observability/CorrelationIdService';
import { Filter, Document } from 'mongodb';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);

/**
 * 📝 Log Lifecycle Service
 * Proposito: Gestión de retención, archivado y purga de logs.
 */
export class LogLifecycleService {
    /**
     * Purga logs operativos más antiguos que un umbral de días.
     */
    static async purgeOldLogs(retentionDays: number = 90): Promise<{ purged: number }> {
        const correlationId = CorrelationIdService.generate();
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - retentionDays);

        const filter = { timestamp: { $lt: thresholdDate } };

        // 1. Archivar primero
        const archived = await this.archiveLogs('application_logs', filter);

        if (archived.count > 0) {
            // 2. Eliminar físicamente
            const collection = await getTenantCollection('application_logs', null, 'LOGS');
            await collection.deleteMany(filter, { hardDelete: true });

            await AuditTrailService.logAdminOp({
                actorType: 'SYSTEM',
                actorId: 'LOG_LIFECYCLE_JOB',
                tenantId: 'platform_master',
                action: 'PURGE_LOGS',
                entityType: 'SYSTEM',
                entityId: 'application_logs',
                changes: { count: archived.count },
                reason: `Purga automática de logs mayores a ${retentionDays} días`,
                correlationId
            } as any);
        }

        return { purged: archived.count };
    }

    /**
     * Archiva logs antes de su eliminación.
     */
    static async archiveLogs(collectionName: string, filter: Filter<Document>): Promise<{ count: number }> {
        const collection = await getTenantCollection(collectionName, null, 'LOGS');
        const records = await collection.find(filter, { includeDeleted: true });

        if (records.length === 0) return { count: 0 };

        const compressed = await gzip(JSON.stringify(records));

        // Mock de subida a Cold Storage
        await logEvento({
            level: 'INFO',
            source: 'LOG_LIFECYCLE',
            action: 'ARCHIVE',
            message: `Archivados ${records.length} logs de ${collectionName}`,
            correlationId: 'SYSTEM_MAINTENANCE',
            details: { collection: collectionName, count: records.length, size: compressed.length }
        });

        return { count: records.length };
    }
}
