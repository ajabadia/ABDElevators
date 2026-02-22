import { db } from "@/lib/db";
import { getTenantCollection } from "@/lib/db-tenant";
import { logEvento } from "@/lib/logger";

/**
 * SelfHealingResyncService: Audit and fix discrepancies between knowledge_assets and document_chunks.
 */
export class SelfHealingResyncService {
    /**
     * Resyncs chunk counts for a specific asset or all assets in a tenant.
     */
    static async resyncAssetChunks(tenantId: string, correlationId: string, filename?: string) {
        const start = Date.now();
        const knowledgeAssetsCollection = await getTenantCollection('knowledge_assets', {
            user: { id: 'system_resync', tenantId, role: 'SUPER_ADMIN' }
        });
        const chunksCollection = await getTenantCollection('document_chunks', {
            user: { id: 'system_resync', tenantId, role: 'SUPER_ADMIN' }
        });

        const query: any = { tenantId };
        if (filename) query.filename = filename;

        const assets = await knowledgeAssetsCollection.find(query).toArray();
        let fixedCount = 0;

        for (const asset of assets) {
            // Count actual chunks
            const actualCount = await chunksCollection.countDocuments({
                sourceDoc: asset.filename,
                tenantId
            });

            const hasDiscrepancy =
                asset.totalChunks !== actualCount ||
                asset.hasChunks !== (actualCount > 0);

            if (hasDiscrepancy) {
                await knowledgeAssetsCollection.updateOne(
                    { _id: asset._id },
                    {
                        $set: {
                            totalChunks: actualCount,
                            hasChunks: actualCount > 0,
                            updatedAt: new Date(),
                            // If it had 0 chunks but now has some, maybe it was STUCK_NO_INDEX
                            ingestionStatus: (asset.ingestionStatus === 'STORED_NO_INDEX' && actualCount > 0) ? 'COMPLETED' : asset.ingestionStatus
                        }
                    }
                );
                fixedCount++;
            }
        }

        await logEvento({
            level: 'INFO',
            source: 'SELF_HEALING_RESYNC',
            action: 'RESYNC_COMPLETE',
            message: `Resync complete for tenant ${tenantId}. Audited: ${assets.length}, Fixed: ${fixedCount}`,
            correlationId,
            tenantId,
            details: { audited: assets.length, fixed: fixedCount, duration_ms: Date.now() - start }
        });

        return { audited: assets.length, fixed: fixedCount };
    }
}
