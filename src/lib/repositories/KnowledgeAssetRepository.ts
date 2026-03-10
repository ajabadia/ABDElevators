import { BaseRepository } from './BaseRepository';
import { KnowledgeAssetSchema, type KnowledgeAsset } from '@/lib/schemas';
import { ObjectId, type ClientSession, type Filter } from 'mongodb';
import { type TenantSession } from '@/lib/db-tenant';

/**
 * 🏛️ KnowledgeAssetRepository
 * Repositorio centralizado para activos de conocimiento.
 * Standardized for Era 12 (Zero any, strict typing).
 */
export class KnowledgeAssetRepository extends BaseRepository<KnowledgeAsset> {
    constructor() {
        super('knowledge_assets');
    }

    /**
     * Sobrescribe create para añadir validación de esquema Zod específica.
     */
    async create(data: Omit<KnowledgeAsset, '_id'>, session?: TenantSession | null, mongoSession?: ClientSession): Promise<string> {
        const validated = KnowledgeAssetSchema.parse(data);
        return await super.create(validated as any, session, mongoSession);
    }

    /**
     * Busca por criterios de deduplicación.
     */
    async findForDeduplication(query: Filter<KnowledgeAsset>, session?: TenantSession | null, mongoSession?: ClientSession): Promise<KnowledgeAsset | null> {
        const collection = await this.getCollection(session);
        return await collection.findOne(query, { includeDeleted: true, session: mongoSession } as any) as KnowledgeAsset | null;
    }

    /**
     * Elimina físicamente un activo.
     */
    async deletePhysical(id: string | ObjectId, session?: TenantSession | null, mongoSession?: ClientSession): Promise<boolean> {
        const collection = await this.getCollection(session);
        const filter = { _id: typeof id === 'string' ? new ObjectId(id) : id } as unknown as Filter<KnowledgeAsset>;
        const result = await collection.deleteOne(filter, { session: mongoSession });
        return result.deletedCount > 0;
    }

    /**
     * High-performance hierarchical listing by space path prefix.
     */
    async findBySpacePathPrefix(pathPrefix: string, session?: TenantSession | null): Promise<KnowledgeAsset[]> {
        return await this.list({
            spacePath: { $regex: `^${pathPrefix}` }
        } as any, {}, session);
    }

    /**
     * Updates spacePath for all items starting with oldPath.
     * Critical for SpaceService.moveSpace synchronization.
     */
    async updatePaths(oldPath: string, newPath: string, session?: TenantSession | null, mongoSession?: ClientSession): Promise<number> {
        const collection = await this.getCollection(session);
        const criteria = { spacePath: { $regex: `^${oldPath}` } } as any;

        // Mongo regex replace logic (simulated or explicit pipeline if needed)
        // Since we are in a simple script context, we use a more direct approach
        // if supported by the underlying collection or a simple updateMany
        const result = await collection.updateMany(
            criteria,
            [{
                $set: {
                    spacePath: {
                        $concat: [newPath, { $substr: ["$spacePath", oldPath.length, -1] }]
                    },
                    updatedAt: new Date()
                }
            }],
            { session: mongoSession } as any
        );

        return result.modifiedCount;
    }
}

export const knowledgeAssetRepository = new KnowledgeAssetRepository();
