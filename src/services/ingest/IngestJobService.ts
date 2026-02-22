
import { KnowledgeAssetRepository } from './KnowledgeAssetRepository';
import { IngestAuditService } from './IngestAuditService';
import { AppError } from '@/lib/errors';
import { ObjectId } from 'mongodb';

/**
 * 📋 Ingest Job Service
 * Proposito: Seguimiento de estado y consulta de trabajos de ingestión.
 */
export class IngestJobService {
    /**
     * Obtiene el estado actual de un trabajo de ingestión.
     */
    static async getJobStatus(assetId: string, tenantId: string) {
        const asset = await KnowledgeAssetRepository.findById(assetId);
        if (!asset) throw new AppError('NOT_FOUND', 404, 'Ingest job not found');

        return {
            assetId,
            status: asset.status, // PENDING | PROCESSING | COMPLETED | FAILED
            originalName: asset.originalName,
            progress: asset.progress || 0,
            error: asset.error,
            updatedAt: asset.updatedAt
        };
    }


    /**
     * Obtiene el log de auditoría detallado de un trabajo.
     */
    static async getJobLogs(assetId: string, tenantId: string) {
        return await IngestAuditService.getLogsByAssetId(assetId);
    }
}
