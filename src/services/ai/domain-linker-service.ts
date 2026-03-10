import { getTenantCollection } from '@/lib/db-tenant';
import { z } from 'zod';
import { AppError } from '@/lib/errors';
import { RagService } from '../core/RagService';
import { type TenantId, type EntityId, EntityIdSchema, TenantIdSchema } from '@/lib/schemas';

/**
 * 🔗 Zod Schema for Domain Linking
 */
export const LinkEntitySchema = z.object({
    entityId: EntityIdSchema,
    entityType: z.enum(['ORDER', 'ASSET', 'TICKET']),
    metadata: z.record(z.string(), z.any()),
    tenantId: TenantIdSchema
});

export type LinkEntityInput = z.infer<typeof LinkEntitySchema>;

export interface LinkedDocument {
    assetId: string;
    assetName: string;
    confidence: number;
    reason: string;
}

/**
 * 🚀 DomainLinkerService
 * Phase 308: Universal Domain Intelligence.
 * Automatically connects entities to the knowledge base.
 */
export class DomainLinkerService {
    /**
     * Suggest technical documents for a given entity based on its metadata.
     */
    static async suggestDocuments(input: LinkEntityInput): Promise<LinkedDocument[]> {
        const validated = LinkEntitySchema.parse(input);
        const { entityType, metadata, tenantId } = validated;

        // 1. Construct a search query from metadata
        let searchQuery = `${entityType} context: `;
        if (metadata.model) searchQuery += `model ${metadata.model} `;
        if (metadata.description) searchQuery += metadata.description;

        // 2. Perform semantic search across knowledge assets
        const assetsCollection = await getTenantCollection('knowledge_assets');

        // Use RagService to find relevant documents (simplified for this iteration)
        const relevantDocs = await assetsCollection.find({
            tenantId,
            $text: { $search: searchQuery } // Fallback to text search if vector not ready
        }, { limit: 5 });

        return relevantDocs.map((doc: any) => ({
            assetId: doc._id.toString(),
            assetName: doc.name,
            confidence: 0.85, // Placeholder for actual semantic score
            reason: `Matched ${entityType} metadata with document content.`
        }));
    }

    /**
     * Persists a link between an entity and a document.
     */
    static async linkEntityToDocument(tenantId: TenantId, entityId: EntityId, assetId: EntityId) {
        const collection = await getTenantCollection('entity_links');

        await collection.updateOne(
            { tenantId, entityId, assetId },
            {
                $set: {
                    updatedAt: new Date(),
                    status: 'ACTIVE'
                },
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
        );
    }
}
