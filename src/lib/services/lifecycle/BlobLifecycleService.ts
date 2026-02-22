
import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { CorrelationIdService } from '@/services/common/CorrelationIdService';

/**
 * 📦 Blob Lifecycle Service
 * Proposito: Gestión de archivos físicos (Blobs) y su consistencia con activos de conocimiento.
 */
export class BlobLifecycleService {
    /**
     * Limpia blobs que ya no tienen referencia en KnowledgeAssets.
     */
    static async cleanOrphanedBlobs(): Promise<{ cleaned: number }> {
        const correlationId = CorrelationIdService.generate();
        const assetsColl = await getTenantCollection('knowledge_assets');
        const blobsColl = await getTenantCollection('file_blobs');

        // 1. Identificar MD5s en uso
        const referencedMd5s = await assetsColl.aggregate([
            { $match: { fileMd5: { $exists: true } } },
            { $group: { _id: '$fileMd5' } }
        ]);
        const md5Set = new Set(referencedMd5s.map((r: any) => r._id));

        // 2. Buscar blobs huérfanos
        const orphanedFilter = { _id: { $not: { $in: Array.from(md5Set) } } };
        const orphanedCount = await blobsColl.countDocuments(orphanedFilter);

        if (orphanedCount > 0) {
            // 3. Purga física de la DB
            await blobsColl.deleteMany(orphanedFilter, { hardDelete: true });

            await logEvento({
                level: 'WARN',
                source: 'BLOB_LIFECYCLE',
                action: 'PURGE_ORPHANED',
                message: `Eliminados ${orphanedCount} blobs huérfanos`,
                correlationId
            });
        }

        return { cleaned: orphanedCount };
    }
}
