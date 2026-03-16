import { getTenantCollection } from '@/lib/db-tenant';
import { CorrelationIdService } from '@/services/observability/CorrelationIdService';
import { KnowledgeAsset, KnowledgeAssetSchema } from '@/lib/schemas/knowledge';
import { ObjectId } from 'mongodb';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';

/**
 * 📚 KnowledgeReviewService: Handles the lifecycle of manual review for knowledge assets.
 * Implements Phase 81: Scheduled Review Dates for technical manuals.
 */
export class KnowledgeReviewService {
    private static async log(data: { level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', action: string, message: string, correlationId?: string, tenantId?: string, details?: any }) {
        return logEvento({
            source: 'KNOWLEDGE_REVIEW_SERVICE',
            ...data
        });
    }

    /**
     * Finds assets that are expired or about to expire for a given tenant.
     */
    static async getExpiringAssets(session: any, daysThreshold: number = 30) {
        const collection = await getTenantCollection('knowledge_assets', session);
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

        const docs = await collection.find({
            nextReviewDate: { $lte: thresholdDate },
            reviewStatus: { $ne: 'reviewed' }
        }).toArray();

        return (docs as any[]).sort((a, b) =>
            new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime()
        );
    }

    /**
     * Marks an asset as reviewed and schedules the next review.
     */
    static async markAsReviewed(assetId: string, nextReviewDate: Date, session: any, notes?: string) {
        const correlationId = CorrelationIdService.generate();
        const performer = session.user.email || session.user.id;

        try {
            const { knowledgeAssetRepository } = await import('@/lib/repositories/KnowledgeAssetRepository');
            const asset = await knowledgeAssetRepository.findById(assetId, session);

            if (!asset) {
                await this.log({
                    level: 'ERROR',
                    action: 'MARK_REVIEWED_NOT_FOUND',
                    message: `Asset ${assetId} not found or access denied`,
                    correlationId,
                    details: { tenantId: session.user.tenantId }
                });
                throw new AppError('NOT_FOUND', 404, 'Asset not found');
            }

            const historyEntry = {
                date: new Date(),
                action: 'reviewed',
                user: performer,
                notes: notes || 'Manual Review'
            };

            await knowledgeAssetRepository.update(assetId, {
                reviewStatus: 'reviewed',
                lastReviewedAt: new Date(),
                nextReviewDate,
                $push: { reviewHistory: historyEntry }
            } as any, session);

            await this.log({
                level: 'INFO',
                action: 'ASSET_REVIEWED',
                message: `Asset ${asset.source?.filename || assetId} marked as reviewed by ${performer}`,
                correlationId,
                details: { assetId, nextReviewDate }
            });

            return { success: true };
        } catch (error: any) {
            console.error(`[KNOWLEDGE_REVIEW_SERVICE] markAsReviewed error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Snoozes the review for a specific asset.
     */
    static async snoozeReview(assetId: string, session: any, days: number = 7) {
        const correlationId = CorrelationIdService.generate();
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + days);

        try {
            const { knowledgeAssetRepository } = await import('@/lib/repositories/KnowledgeAssetRepository');
            const asset = await knowledgeAssetRepository.findById(assetId, session);
            
            if (!asset) throw new AppError('NOT_FOUND', 404, 'Asset not found');

            await knowledgeAssetRepository.update(assetId, {
                reviewStatus: 'snoozed',
                nextReviewDate: nextDate
            } as any, session);

            await this.log({
                level: 'INFO',
                action: 'ASSET_SNOOZED',
                message: `Asset ${asset.source?.filename || assetId} snoozed for ${days} days`,
                correlationId,
                details: { assetId, nextDate }
            });

            return { success: true, nextDate };
        } catch (error: any) {
            console.error(`[KNOWLEDGE_REVIEW_SERVICE] snoozeReview error: ${error.message}`);
            throw error;
        }
    }
}
