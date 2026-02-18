import { getTenantCollection, withTransaction } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { KnowledgeAsset } from '@/lib/schemas/knowledge';
import { UserRole } from '@/types/roles';
import { addDays, isPast } from 'date-fns';

/**
 * 🛠️ Self-Healing Service (Phase 110)
 * Foundations for automatic auditing and maintenance of knowledge assets.
 */
export class SelfHealingService {
    private static readonly SYSTEM_SESSION = {
        user: {
            id: 'system-self-healing',
            tenantId: 'platform_master',
            role: UserRole.SUPER_ADMIN,
        }
    };

    /**
     * Audits all knowledge assets across all tenants to find expired documents.
     * Documents with nextReviewDate in the past are marked as obsolete.
     */
    static async auditExpiredAssets(correlationId: string) {
        const collection = await getTenantCollection<KnowledgeAsset>('knowledge_assets', this.SYSTEM_SESSION);
        const rawCollection = collection.unsecureRawCollection; // Bypass tenant filter for global audit

        const now = new Date();

        // 1. Find expired assets that are still marked as 'vigente'
        const expiredAssets = await rawCollection.find({
            nextReviewDate: { $lt: now },
            status: 'vigente',
            deletedAt: { $exists: false }
        }).toArray();

        if (expiredAssets.length === 0) {
            return { processed: 0, updated: 0 };
        }

        let updatedCount = 0;

        for (const asset of expiredAssets) {
            try {
                // Update asset status
                await rawCollection.updateOne(
                    { _id: asset._id },
                    {
                        $set: {
                            status: 'obsoleto',
                            reviewStatus: 'expired',
                            updatedAt: now
                        }
                    }
                );

                // Log per-asset event
                await logEvento({
                    level: 'WARN',
                    source: 'SELF_HEALING',
                    action: 'ASSET_AUTO_OBSOLETE',
                    message: `Asset ${asset.filename} (${asset._id}) marked as obsolete due to expiration.`,
                    tenantId: asset.tenantId,
                    correlationId,
                    details: {
                        assetId: asset._id,
                        nextReviewDate: asset.nextReviewDate,
                        tenantId: asset.tenantId
                    }
                });

                updatedCount++;
            } catch (error: any) {
                await logEvento({
                    level: 'ERROR',
                    source: 'SELF_HEALING',
                    action: 'ASSET_AUDIT_FAILED',
                    message: `Failed to process asset ${asset._id}: ${error.message}`,
                    correlationId,
                    details: { assetId: asset._id }
                });
            }
        }

        // Global summary log
        await logEvento({
            level: 'INFO',
            source: 'SELF_HEALING',
            action: 'AUDIT_COMPLETED',
            message: `Global asset audit completed. ${updatedCount} assets marked as obsolete.`,
            correlationId,
            details: {
                totalChecked: expiredAssets.length,
                updated: updatedCount
            }
        });

        return { processed: expiredAssets.length, updated: updatedCount };
    }

    /**
     * Future functionality: cleanup of unused document chunks or shadow copies.
     */
    static async cleanupOrphanedChunks(correlationId: string) {
        // To be implemented in later stages of Phase 110
        return { success: true };
    }
}
