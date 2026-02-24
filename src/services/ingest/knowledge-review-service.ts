import { getTenantCollection } from '../db-tenant';
import { KnowledgeAsset, KnowledgeAssetSchema } from '../schemas/knowledge';
import { ObjectId } from 'mongodb';
import { AppError } from '../errors';
import { logEvento } from '../logger';
import crypto from 'crypto';

/**
 * 📚 KnowledgeReviewService: Handles the lifecycle of manual review for knowledge assets.
 * Implements Phase 81: Scheduled Review Dates for technical manuals.
 */
export class KnowledgeReviewService {
    /**
     * Finds assets that are expired or about to expire for a given tenant.
     * @param tenantId The tenant ID
     * @param daysThreshold Number of days to look ahead (default: 30)
     */
    static async getExpiringAssets(tenantId: string, daysThreshold: number = 30) {
        const collection = await getTenantCollection('knowledge_assets');
        const now = new Date();
        const thresholdDate = new Date();
        thresholdDate.setDate(now.getDate() + daysThreshold);

        const docs = await collection.find({
            tenantId,
            nextReviewDate: { $lte: thresholdDate },
            reviewStatus: { $ne: 'reviewed' }
        });

        return (docs as any[]).sort((a, b) =>
            new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime()
        );
    }

    /**
     * Marks an asset as reviewed and schedules the next review.
     * @param assetId The ID of the knowledge asset
     * @param nextReviewDate The next scheduled review date
     * @param notes Optional notes for the review
     * @param performer Email or ID of the user performing the review
     */
    static async markAsReviewed(
        assetId: string,
        nextReviewDate: Date,
        performer: string,
        notes?: string
    ) {
        const correlationId = crypto.randomUUID();
        const collection = await getTenantCollection('knowledge_assets');

        const asset = await collection.findOne({ _id: new ObjectId(assetId) });
        if (!asset) throw new AppError('NOT_FOUND', 404, 'Asset not found');

        const updateData = {
            reviewStatus: 'reviewed',
            lastReviewedAt: new Date(),
            nextReviewDate,
            reviewNotes: notes,
            updatedAt: new Date()
        };

        await collection.updateOne(
            { _id: new ObjectId(assetId) },
            { $set: updateData }
        );

        // Audit Trail
        const { AuditTrailService } = await import('@/services/observability/AuditTrailService');
        await AuditTrailService.logConfigChange({
            actorType: 'USER',
            actorId: performer,
            tenantId: asset.tenantId,
            action: 'KNOWLEDGE_ASSET_REVIEWED',
            entityType: 'KNOWLEDGE_ASSET',
            entityId: assetId,
            changes: {
                before: { reviewStatus: asset.reviewStatus, nextReviewDate: asset.nextReviewDate },
                after: { reviewStatus: 'reviewed', nextReviewDate }
            },
            correlationId
        } as any);

        await logEvento({
            level: 'INFO',
            source: 'KNOWLEDGE_REVIEW_SERVICE',
            action: 'ASSET_REVIEWED',
            correlationId,
            message: `Asset ${asset.filename} marked as reviewed by ${performer}`,
            details: { assetId, nextReviewDate }
        });

        return { success: true };
    }

    /**
     * Snoozes the review for a specific asset.
     */
    static async snoozeReview(assetId: string, days: number = 7) {
        const collection = await getTenantCollection('knowledge_assets');
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + days);

        await collection.updateOne(
            { _id: new ObjectId(assetId) },
            {
                $set: {
                    reviewStatus: 'snoozed',
                    nextReviewDate: nextDate,
                    updatedAt: new Date()
                }
            }
        );

        return { success: true, nextDate };
    }
}
