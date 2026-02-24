
import { LogLifecycleService } from '@/services/observability/LogLifecycleService';
import { UsageAggregationService } from '@/services/observability/UsageAggregationService';
import { logEvento } from '@/lib/logger';
import { Filter, Document } from 'mongodb';

/**
 * ♻️ Data Lifecycle Service (Orchestrator)
 * Proposito: Punto de entrada único para la gestión del ciclo de vida de los datos.
 * Refactored Phase 5+: Delegando a servicios especializados.
 * [HOTFIX] Phase 133: Stubbing missing services to fix build errors.
 */
export class DataLifecycleService {
    /**
     * @deprecated Use LogLifecycleService.archiveLogs
     */
    static async archiveBeforePurge(collectionName: string, filter: Filter<Document>, dbType: 'MAIN' | 'LOGS' | 'AUTH' = 'LOGS') {
        return await LogLifecycleService.archiveLogs(collectionName, filter);
    }

    /**
     * Purga logs operativos.
     */
    static async purgeOldLogs(retentionDays: number = 90) {
        return await LogLifecycleService.purgeOldLogs(retentionDays);
    }

    /**
     * Limpia blobs huérfanos.
     */
    static async cleanOrphanedBlobs() {
        console.warn('⚠️ [DataLifecycleService] cleanOrphanedBlobs: BlobLifecycleService not found. Implementation pending.');
        return { count: 0, status: 'STUBBED' };
    }

    /**
     * Derecho al olvido (GDPR).
     */
    static async rightToBeForgotten(tenantId: string, userId?: string) {
        await logEvento({
            level: 'WARN',
            source: 'LIFECYCLE_SERVICE',
            action: 'GDPR_REQUEST_STUB',
            message: `Solicitud de derecho al olvido para ${tenantId} / ${userId}. Servicio no implementado.`,
            tenantId
        });
        return { success: false, message: 'Servicio GDPR temporalmente fuera de servicio' };
    }

    /**
     * Agregación de métricas de uso.
     */
    static async aggregateMetrics(days: number = 30) {
        return await UsageAggregationService.aggregateMetrics(days);
    }

    /**
     * Limpieza de soft deletes.
     */
    static async processSoftDeletes(retentionDays: number = 30) {
        console.warn('⚠️ [DataLifecycleService] processSoftDeletes: SoftDeleteService not found. Implementation pending.');
        return { purged: 0, status: 'STUBBED' };
    }
}

