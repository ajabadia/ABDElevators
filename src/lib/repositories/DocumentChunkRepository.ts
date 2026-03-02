import { BaseRepository } from './BaseRepository';
import { DocumentChunkSchema, type DocumentChunk } from '@/lib/schemas';
import { type ClientSession } from 'mongodb';
import { type TenantSession } from '@/lib/db-tenant';

/**
 * 🏛️ DocumentChunkRepository
 * Repositorio centralizado para fragmentos de documentos (chunks).
 * Hardened Era 8: Strict types and transaction support.
 */
export class DocumentChunkRepository extends BaseRepository<DocumentChunk> {
    protected readonly collectionName = 'document_chunks';

    /**
     * Crea un nuevo chunk validando contra el schema.
     */
    async create(data: Omit<DocumentChunk, '_id'>, session?: TenantSession | null, mongoSession?: ClientSession): Promise<string> {
        const validated = DocumentChunkSchema.parse(data);
        return await super.create(validated as any, session, mongoSession);
    }

    /**
     * Elimina chunks por ID de activo.
     */
    async deleteByAssetId(assetId: string, session?: TenantSession | null, mongoSession?: ClientSession): Promise<number> {
        const collection = await this.getCollection(session);
        const result = await collection.deleteMany({ assetId } as any, { session: mongoSession });
        return result.deletedCount;
    }
}

// Export singleton instance
export const documentChunkRepository = new DocumentChunkRepository();
