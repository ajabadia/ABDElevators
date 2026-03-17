import { knowledgeAssetRepository } from '@/lib/repositories/KnowledgeAssetRepository';
import { documentChunkRepository } from '@/lib/repositories/DocumentChunkRepository';
import { IngestStorageService } from './IngestStorageService';
import { IngestAuditService } from './IngestAuditService';
import { AppError } from '@/lib/errors';
import { connectDB } from '@/lib/db';

/**
 * ♻️ Ingest Data Lifecycle Service
 * Proposito: Gestionar el ciclo de vida de los activos (Baja, Archivado, Limpieza).
 */
export class IngestDataLifecycleService {
    /**
     * Elimina un activo y todos sus datos relacionados (Chunks, Archivos).
     */
    static async deleteAsset(assetId: string, correlationId: string, tenantId: string, hardDelete: boolean = false) {
        const db = await connectDB();
        const session = db.client.startSession();

        try {
            await session.withTransaction(async () => {
                const asset = await knowledgeAssetRepository.findById(assetId, null, session);
                if (!asset) throw new AppError('NOT_FOUND', 404, 'Asset not found');

                // 1. Eliminar Chunks (Base de Datos)
                const { EntityIdSchema } = await import('@/lib/schemas/common');
                await documentChunkRepository.deleteByAssetId(EntityIdSchema.parse(assetId), null, session);

                // 2. Eliminar Archivos (GridFS / Cloudinary)
                // Usamos blobId para GridFS o cloudinaryPublicId para Cloudinary
                const storageKey = asset.blobId || asset.cloudinaryPublicId || asset.source?.storageKey;
                if (storageKey) {
                    await IngestStorageService.deleteFile(storageKey, correlationId);
                }

                // 3. Eliminar Asset (Soft delete o físico según política)
                await knowledgeAssetRepository.deleteEntity(assetId, null, hardDelete, session);

                // 4. Auditoría
                await IngestAuditService.logEvent({
                    docId: assetId,
                    correlationId,
                    tenantId,
                    action: 'DELETE',
                    status: 'SUCCESS',
                    performedBy: 'system', // Default for lifecycle for now, or use session if passed
                    filename: asset.source?.originalName || asset.source?.filename || 'unknown',
                    sizeBytes: asset.source?.sizeBytes || 0,
                    md5: asset.fileMd5 || asset.source?.checksum || 'unknown',
                    details: {
                        duration_ms: 0
                    }
                }, null);
            });
        } finally {
            await session.endSession();
        }
    }

    /**
     * Archiva un activo (cambia estado y quizás mueve almacenamiento).
     */
    static async archiveAsset(assetId: string, correlationId: string, tenantId: string) {
        await knowledgeAssetRepository.update(assetId, {
            status: 'ARCHIVED',
            updatedAt: new Date()
        } as any);

        await IngestAuditService.logEvent({
            docId: assetId,
            correlationId,
            tenantId,
            action: 'ARCHIVE',
            status: 'SUCCESS',
            performedBy: 'system',
            filename: 'unknown', // We don't have the asset object here, could fetch it but for ARCHIVE 'unknown' is better than crashing
            sizeBytes: 0,
            md5: 'unknown',
            details: {
                duration_ms: 0
            }
        }, null);
    }
}
