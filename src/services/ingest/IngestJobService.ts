import { knowledgeAssetRepository } from '@/lib/repositories/KnowledgeAssetRepository';
import { IngestAuditService } from './IngestAuditService';
import { AppError } from '@/lib/errors';

/**
 * 📋 Ingest Job Service
 * Proposito: Seguimiento de estado y consulta de trabajos de ingestión.
 */
export class IngestJobService {
    /**
     * Obtiene el estado actual de un trabajo de ingestión.
     */
    static async getJobStatus(assetId: string, tenantId: string) {
        const asset = await knowledgeAssetRepository.findById(assetId);
        if (!asset) throw new AppError('NOT_FOUND', 404, 'Ingest job not found');

        return {
            assetId,
            status: asset.ingestionStatus || 'PENDING', // PENDING | PROCESSING | COMPLETED | FAILED
            originalName: (asset as any).originalName || asset.filename,
            progress: (asset as any).progress || 0,
            error: (asset as any).error,
            updatedAt: (asset as any).updatedAt || new Date()
        };
    }


    /**
     * Obtiene el log de auditoría detallado de un trabajo.
     */
    static async getJobLogs(assetId: string, tenantId: string) {
        return await IngestAuditService.getLogsByAssetId(assetId);
    }
}
