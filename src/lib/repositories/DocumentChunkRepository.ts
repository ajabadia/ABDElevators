import { BaseRepository, type SafeFilter, type SafeUpdate } from './BaseRepository';
import { DocumentChunkSchema, type DocumentChunk } from '@/lib/schemas';
import { type ClientSession } from 'mongodb';
import { type TenantSession } from '@/lib/db-tenant';
import { EntityId, TenantId } from '@/lib/schemas/common';

/**
 * 🏛️ DocumentChunkRepository
 * Repositorio centralizado para fragmentos de documentos (chunks).
 * Hardened Era 8: Strict types and transaction support.
 */
export class DocumentChunkRepository extends BaseRepository<DocumentChunk> {
    constructor() {
        super('document_chunks');
    }

    /**
     * Crea un nuevo chunk validando contra el schema.
     */
    async create(data: Omit<DocumentChunk, '_id'>, session?: TenantSession | null, mongoSession?: ClientSession): Promise<EntityId> {
        const validated = DocumentChunkSchema.parse(data);
        return await super.create(validated, session, mongoSession);
    }

    /**
     * Elimina chunks por ID de activo.
     */
    async deleteByAssetId(assetId: EntityId, session?: TenantSession | null, mongoSession?: ClientSession): Promise<number> {
        const collection = await this.getCollection(session);
        const result = await collection.deleteMany({ assetId } as SafeFilter<DocumentChunk>, { session: mongoSession });
        return result.deletedCount;
    }

    /**
     * Updates spacePath for all chunks associated with an asset.
     */
    async updatePathByAsset(assetId: EntityId, newPath: string, session?: TenantSession | null, mongoSession?: ClientSession): Promise<number> {
        const collection = await this.getCollection(session);
        const result = await collection.updateMany(
            { assetId } as SafeFilter<DocumentChunk>,
            { $set: { spacePath: newPath } },
            { session: mongoSession }
        );
        return result.modifiedCount;
    }

    /**
     * Bulk update chunks in a hierarchy (Space move sync).
     */
    async updatePaths(oldPath: string, newPath: string, session?: TenantSession | null, mongoSession?: ClientSession): Promise<number> {
        const collection = await this.getCollection(session);
        const result = await collection.updateMany(
            { spacePath: { $regex: `^${oldPath}` } } as SafeFilter<DocumentChunk>,
            [{
                $set: {
                    spacePath: {
                        $concat: [newPath, { $substr: ["$spacePath", oldPath.length, -1] }]
                    }
                }
            }],
            { session: mongoSession }
        );
        return result.modifiedCount;
    }
}

// Export singleton instance
export const documentChunkRepository = new DocumentChunkRepository();
