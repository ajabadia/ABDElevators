
import { KnowledgeAssetRepository } from './KnowledgeAssetRepository';
import { DocumentChunkRepository } from './DocumentChunkRepository';
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
    static async deleteAsset(assetId: string, correlationId: string, tenantId: string) {
        const db = await connectDB();
        const session = db.client.startSession();

        try {
            await session.withTransaction(async () => {
                const asset = await KnowledgeAssetRepository.findById(assetId, session);
                if (!asset) throw new AppError('NOT_FOUND', 404, 'Asset not found');

                // 1. Eliminar Chunks (Base de Datos)
                await DocumentChunkRepository.deleteByAssetId(assetId, session);

                // 2. Eliminar Archivos (GridFS / Cloudinary)
                if (asset.storagePath) {
                    await IngestStorageService.deleteFile(asset.storagePath, correlationId);
                }

                // 3. Eliminar Asset (Soft delete o físico según política)
                await KnowledgeAssetRepository.deletePhysical(assetId, session);

                // 4. Auditoría
                await IngestAuditService.logEvent({
                    assetId,
                    correlationId,
                    tenantId,
                    action: 'DELETE',
                    status: 'SUCCESS',
                    details: { fileName: asset.originalName }
                });
            });
        } finally {
            await session.endSession();
        }
    }

    /**
     * Archiva un activo (cambia estado y quizás mueve almacenamiento).
     */
    static async archiveAsset(assetId: string, correlationId: string, tenantId: string) {
        await KnowledgeAssetRepository.update(assetId, {
            $set: {
                status: 'ARCHIVED',
                updatedAt: new Date()
            }
        });

        await IngestAuditService.logEvent({
            assetId,
            correlationId,
            tenantId,
            action: 'ARCHIVE',
            status: 'SUCCESS'
        });
    }
}
