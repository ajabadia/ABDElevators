
import { LogLifecycleService } from './lifecycle/LogLifecycleService';
import { BlobLifecycleService } from './lifecycle/BlobLifecycleService';
import { GdprService } from './lifecycle/GdprService';
import { SoftDeleteService } from './lifecycle/SoftDeleteService';
import { UsageAggregationService } from './lifecycle/UsageAggregationService';
import { Filter, Document } from 'mongodb';

/**
 * ♻️ Data Lifecycle Service (Orchestrator)
 * Proposito: Punto de entrada único para la gestión del ciclo de vida de los datos.
 * Refactored Phase 5+: Delegando a servicios especializados.
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
        return await BlobLifecycleService.cleanOrphanedBlobs();
    }

    /**
     * Derecho al olvido (GDPR).
     */
    static async rightToBeForgotten(tenantId: string, userId?: string) {
        return await GdprService.rightToBeForgotten(tenantId, userId);
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
        return await SoftDeleteService.purgeSoftDeleted(retentionDays);
    }
}

