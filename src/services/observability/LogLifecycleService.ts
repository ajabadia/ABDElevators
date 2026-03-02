
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
 * Proposito: Gestión de retención, archivado y purga de logs.
 * Hardened Era 8: Repository-based lifecycle management.
 */
export class LogLifecycleService {
    /**
     * Purga logs operativos más antiguos que un umbral de días.
     */
    static async purgeOldLogs(retentionDays: number = 90): Promise<{ purged: number }> {
        const correlationId = CorrelationIdService.generate();
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - retentionDays);

        const filter: Filter<Document> = { timestamp: { $lt: thresholdDate } };

        // 1. Archivar primero
        const archived = await this.archiveLogs('application_logs', filter);

        if (archived.count > 0) {
            // 2. Eliminar físicamente vía repository
            await applicationLogRepository.deleteMany(filter as any, null, true);

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
     * Archiva logs antes de su eliminación (Simulado).
     */
    static async archiveLogs(collectionName: string, filter: Filter<Document>): Promise<{ count: number }> {
        // En un entorno real, esto subiría a S3/ColdStorage antes de borrar.
        // Aquí simulamos el conteo para mantener la trazabilidad.

        let records: any[] = [];
        if (collectionName === 'application_logs') {
            records = await applicationLogRepository.list(filter as any);
        }

        if (records.length === 0) return { count: 0 };

        try {
            const compressed = await gzip(JSON.stringify(records));

            await logEvento({
                level: 'INFO',
                source: 'LOG_LIFECYCLE',
                action: 'ARCHIVE',
                message: `Archivados ${records.length} logs de ${collectionName}`,
                correlationId: 'SYSTEM_MAINTENANCE',
                details: { collection: collectionName, count: records.length, size: compressed.length }
            });

            return { count: records.length };
        } catch (error) {
            console.error('[LogLifecycleService] Error archiving logs:', error);
            // Si el archivo falla, devolvemos 0 para no borrar los originales si la política es estricta
            return { count: 0 };
        }
    }
}
