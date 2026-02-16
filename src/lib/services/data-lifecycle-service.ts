import { getTenantCollection } from '../db-tenant';
import { connectLogsDB, connectDB, connectAuthDB } from '@/lib/db';
import { AuditTrailService } from './audit-trail-service';
import { logEvento } from '../logger';
import { Filter, Document } from 'mongodb';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);

/**
 * DataLifecycleService - Gestión del ciclo de vida de los datos, retención y cumplimiento.
 * Phase 132.5
 */
export class DataLifecycleService {

    /**
     * Exporta registros a un formato comprimido antes de eliminarlos.
     * En un entorno real, esto se subiría a un bucket (S3/Azure).
     * Para el MVP, devolvemos el buffer comprimido y logueamos el evento.
     */
    static async archiveBeforePurge(
        collectionName: string,
        filter: Filter<Document>,
        dbType: 'MAIN' | 'LOGS' | 'AUTH' = 'LOGS'
    ): Promise<{ count: number; archivedSize: number }> {
        const collection = await getTenantCollection(collectionName, null, dbType);
        const records = await collection.find(filter, { includeDeleted: true });

        if (records.length === 0) return { count: 0, archivedSize: 0 };

        const jsonData = JSON.stringify(records);
        const compressed = await gzip(jsonData);

        // Simulamos la persistencia en "Cold Storage"
        // En producción: await CloudinaryService.uploadRaw(compressed, `archive/${collectionName}_${Date.now()}.json.gz`);

        await logEvento({
            level: 'INFO',
            source: 'DATA_LIFECYCLE',
            action: 'ARCHIVE_DATA',
            message: `Archivados ${records.length} registros de ${collectionName} antes de purga`,
            correlationId: 'SYSTEM_MAINTENANCE',
            details: {
                collection: collectionName,
                count: records.length,
                compressedSize: compressed.length
            }
        });

        return { count: records.length, archivedSize: compressed.length };
    }

    /**
     * Purga logs operativos más antiguos que un umbral de días.
     */
    static async purgeOldLogs(retentionDays: number = 90): Promise<{ purged: number }> {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - retentionDays);

        const filter = { timestamp: { $lt: thresholdDate } };

        // 1. Archivar primero
        const { count } = await this.archiveBeforePurge('application_logs', filter, 'LOGS');

        if (count > 0) {
            // 2. Eliminar físicamente
            const collection = await getTenantCollection('application_logs', null, 'LOGS');
            await collection.deleteMany(filter, { hardDelete: true });

            await AuditTrailService.logAdminOp({
                actorType: 'SYSTEM',
                actorId: 'DATA_LIFECYCLE_JOB',
                tenantId: 'platform_master',
                action: 'PURGE_LOGS',
                entityType: 'SYSTEM',
                entityId: 'application_logs',
                changes: { before: { count }, after: { deleted: count } },
                reason: `Purga automática de logs mayores a ${retentionDays} días`,
                correlationId: 'SYSTEM_MAINTENANCE'
            } as any);
        }

        return { purged: count };
    }

    /**
     * Limpia blobs de Cloudinary que no tienen referencia en KnowledgeAssets.
     */
    static async cleanOrphanedBlobs(): Promise<{ cleaned: number }> {
        const assetsColl = await getTenantCollection('knowledge_assets');
        const blobsColl = await getTenantCollection('file_blobs');

        // Obtener todos los MD5s referenciados
        const referencedMd5s = await assetsColl.aggregate([
            { $match: { fileMd5: { $exists: true } } },
            { $group: { _id: '$fileMd5' } }
        ]);
        const md5Set = new Set(referencedMd5s.map((r: any) => r._id));

        // Buscar blobs no referenciados
        const orphanedFilter = { _id: { $not: { $in: Array.from(md5Set) } } };
        const orphanedCount = await blobsColl.countDocuments(orphanedFilter);

        if (orphanedCount > 0) {
            // Archivar metadatos del blob antes de borrarlo
            await this.archiveBeforePurge('file_blobs', orphanedFilter, 'MAIN');

            // Nota: El borrado real en Cloudinary requeriría CloudinaryService.delete(publicId)
            // Por ahora marcamos como "reclamables" o borramos de la DB
            await blobsColl.deleteMany(orphanedFilter, { hardDelete: true });

            await logEvento({
                level: 'WARN',
                source: 'DATA_LIFECYCLE',
                action: 'CLEAN_ORPHANED_BLOBS',
                message: `Eliminados ${orphanedCount} blobs huérfanos de la base de datos`,
                correlationId: 'SYSTEM_MAINTENANCE'
            });
        }

        return { cleaned: orphanedCount };
    }

    /**
     * Implementa el Derecho al Olvido (GDPR).
     * Eliminación de nivel nuclear para un Tenant o Usuario.
     */
    static async rightToBeForgotten(tenantId: string, userId?: string): Promise<{ success: boolean }> {
        const correlationId = crypto.randomUUID();

        await logEvento({
            level: 'INFO',
            source: 'GDPR_ENGINE',
            action: 'RIGHT_TO_BE_FORGOTTEN_START',
            message: `Iniciando eliminación total para ${userId ? `usuario ${userId}` : `tenant ${tenantId}`}`,
            correlationId,
            tenantId
        });

        // 1. Archivar todo antes de borrar (Crucial para cumplimiento legal)
        const filter = userId ? { userId } : { tenantId };

        // TODO: Iterar sobre todas las colecciones sensibles y borrar
        // Esta es una implementación simplificada para el MVP
        const collectionsToPurge = ['entities', 'knowledge_assets', 'usage_logs', 'human_validations'];

        for (const collName of collectionsToPurge) {
            await this.archiveBeforePurge(collName, filter, 'MAIN');
            const coll = await getTenantCollection(collName, null, 'MAIN');
            await coll.deleteMany(filter, { hardDelete: true });
        }

        await AuditTrailService.logAdminOp({
            actorType: 'SYSTEM',
            actorId: 'GDPR_SERVICE',
            tenantId,
            action: 'GDPR_FORGET',
            entityType: userId ? 'USER' : 'TENANT',
            entityId: userId || tenantId,
            reason: 'Cumplimiento Derecho al Olvido (GDPR)',
            correlationId
        } as any);

        return { success: true };
    }

    /**
     * Agrega métricas de uso detalladas en resúmenes históricos antes de purgar.
     */
    static async aggregateMetrics(days: number = 30): Promise<{ aggregated: number }> {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - days);

        const logsColl = await getTenantCollection('usage_logs', null, 'LOGS');

        // 1. Obtener datos agregados por Tenant y Tipo
        const aggregation = await logsColl.aggregate([
            { $match: { timestamp: { $lt: thresholdDate } } },
            {
                $group: {
                    _id: { tenantId: '$tenantId', type: '$type' },
                    totalValue: { $sum: '$value' },
                    minDate: { $min: '$timestamp' },
                    maxDate: { $max: '$timestamp' }
                }
            }
        ]);

        const summariesColl = await getTenantCollection('usage_summaries', null, 'LOGS');
        let count = 0;

        for (const entry of aggregation as any[]) {
            await summariesColl.insertOne({
                tenantId: entry._id.tenantId,
                period: 'MONTHLY',
                startDate: entry.minDate,
                endDate: entry.maxDate,
                metrics: { [entry._id.type]: entry.totalValue },
                createdAt: new Date()
            } as any);
            count++;
        }

        if (count > 0) {
            // 2. Archivar y Purgar logs ya agregados
            await this.archiveBeforePurge('usage_logs', { timestamp: { $lt: thresholdDate } }, 'LOGS');
            await logsColl.deleteMany({ timestamp: { $lt: thresholdDate } }, { hardDelete: true });
        }

        return { aggregated: count };
    }

    /**
     * Procesa registros "soft-deleted" que han superado el periodo de retención.
     */
    static async processSoftDeletes(retentionDays: number = 30): Promise<{ cleaned: number }> {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - retentionDays);

        const collections = ['knowledge_assets', 'entities', 'workflow_tasks'];
        let totalCleaned = 0;

        for (const collName of collections) {
            const filter = { deletedAt: { $lt: thresholdDate } };
            const { count } = await this.archiveBeforePurge(collName, filter, 'MAIN');

            if (count > 0) {
                const coll = await getTenantCollection(collName, null, 'MAIN');
                await coll.deleteMany(filter, { hardDelete: true });
                totalCleaned += count;
            }
        }

        return { cleaned: totalCleaned };
    }
}

