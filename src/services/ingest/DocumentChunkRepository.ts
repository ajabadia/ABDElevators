
import { getTenantCollection } from '@/lib/db-tenant';
import { DocumentChunkSchema } from '@/lib/schemas';

/**
 * 🏛️ Document Chunk Repository
 * Proposito: Abstracción de acceso a la colección 'document_chunks'.
 */
export class DocumentChunkRepository {
    private static COLLECTION = 'document_chunks';

    /**
     * Inserta un set de chunks validados.
     */
    static async insertMany(chunks: any[], session?: any) {
        const collection = await getTenantCollection(this.COLLECTION, session);
        const validated = chunks.map(c => DocumentChunkSchema.parse(c));
        return await collection.insertMany(validated);
    }

    /**
     * Inserta un único chunk validado.
     */
    static async insertOne(chunk: any, session?: any) {
        const collection = await getTenantCollection(this.COLLECTION, session);
        const validated = DocumentChunkSchema.parse(chunk);
        return await collection.insertOne(validated);
    }

    /**
     * Elimina todos los chunks asociados a un activo.
     */
    static async deleteByAssetId(assetId: string, session?: any) {
        const collection = await getTenantCollection(this.COLLECTION, session);
        return await collection.deleteMany({ assetId: assetId });
    }
}
