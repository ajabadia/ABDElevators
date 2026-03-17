import { LogLifecycleService } from '@/services/observability/LogLifecycleService';
import { UsageAggregationService } from '@/services/observability/UsageAggregationService';
import { BlobGarbageCollector } from '@/services/ingest/recovery/BlobGarbageCollector';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { connectDB } from '@/lib/db';
import { Filter, Document } from 'mongodb';

/**
 * ♻️ Data Lifecycle Service (Orchestrator)
 * Proposito: Punto de entrada único para la gestión del ciclo de vida de los datos.
 * Hardened Era 8: Integrated and production-ready.
 */
export class DataLifecycleService {
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
        const correlationId = `gc-${Date.now()}`;
        // En Era 8, el GC no requiere una sesión de usuario para cron jobs, sino permisos de sistema.
        const stats = await BlobGarbageCollector.execute(undefined);
        
        await logEvento({
            level: 'INFO',
            source: 'LIFECYCLE_SERVICE',
            action: 'BLOBS_GC_COMPLETE',
            message: `Limpieza de blobs huérfanos completada: ${stats.blobsDeleted} eliminados.`,
            correlationId,
            details: stats
        });

        return stats;
    }

    /**
     * Derecho al olvido (GDPR).
     */
    static async rightToBeForgotten(tenantId: string, userId?: string) {
        if (!tenantId) throw new AppError('VALIDATION_ERROR', 400, 'tenantId is required');
        const correlationId = `gdpr-${Date.now()}`;

        await logEvento({
            level: 'WARN',
            source: 'LIFECYCLE_SERVICE',
            action: 'GDPR_REQUEST_INIT',
            message: `Solicitud de derecho al olvido para ${tenantId}${userId ? ` / Usuario ${userId}` : ' (TENANT COMPLETO)'}.`,
            tenantId,
            correlationId
        });

        const db = await connectDB();
        
        // 1. Borrar activos de conocimiento (esto borra chunks y blobs físicos via IngestDataLifecycleService)
        const assetColl = db.collection('knowledge_assets');
        const assetFilter: Filter<Document> = userId ? { tenantId, ownerId: userId } : { tenantId };
        const assets = await assetColl.find(assetFilter).project({ _id: 1 }).toArray();
        
        const { IngestDataLifecycleService } = await import('@/services/ingest/IngestDataLifecycleService');
        for (const assetDoc of assets) {
            await IngestDataLifecycleService.deleteAsset(assetDoc._id.toString(), correlationId, tenantId, true);
        }

        // 2. Borrar tickets y casos si aplica
        const genericCollections = ['tickets', 'cases', 'orders'];
        const genericFilter: Filter<Document> = userId ? { tenantId, userId } : { tenantId };
        
        for (const collName of genericCollections) {
            await db.collection(collName).deleteMany(genericFilter);
        }

        // 3. Auditoría Final
        const { AuditTrailService } = await import('@/services/observability/AuditTrailService');
        await AuditTrailService.logAdminOp({
            actorId: 'GDPR_CONTROLLER',
            actorType: 'SYSTEM',
            tenantId,
            action: 'GDPR_FORGET_SUCCESS',
            entityType: userId ? 'USER' : 'TENANT',
            entityId: userId || tenantId,
            reason: 'Right to be forgotten compliance execution',
            correlationId
        });

        return { success: true, purgedAssets: assets.length, collectionsCleaned: genericCollections.length };
    }

    /**
     * Agregación de métricas de uso.
     */
    static async aggregateMetrics(days: number = 30) {
        return await UsageAggregationService.aggregateMetrics(days);
    }

    /**
     * Limpieza de soft deletes (Hard-delete de borrados antiguos).
     * ⚡ FASE 304: Automated Cleanup with Audit Trail.
     */
    static async processSoftDeletes(retentionDays: number = 30) {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - retentionDays);

        const db = await connectDB();
        const collections = ['knowledge_assets', 'workflow_definitions', 'tickets', 'prompts'];
        let totalPurged = 0;

        for (const collName of collections) {
            const coll = db.collection(collName);
            const result = await coll.deleteMany({
                deletedAt: { $lt: thresholdDate }
            });
            totalPurged += result.deletedCount;
        }

        // formal audit
        try {
            const { AuditTrailService } = await import('@/services/observability/AuditTrailService');
            await AuditTrailService.logAdminOp({
                actorId: 'SYS_LIFECYCLE_WORKER',
                actorType: 'SYSTEM',
                tenantId: 'platform_master',
                action: 'DATA_PURGE_CLEANUP',
                entityType: 'SYSTEM',
                entityId: 'database',
                reason: `Purga de soft-deletes (> ${retentionDays} días): ${totalPurged} registros en ${collections.join(', ')}`,
                correlationId: `cleanup-${Date.now()}`
            });
        } catch (auditError) {
            console.warn('[DataLifecycleService] Audit failed during cleanup:', auditError);
        }

        return { purged: totalPurged, collections };
    }
}

