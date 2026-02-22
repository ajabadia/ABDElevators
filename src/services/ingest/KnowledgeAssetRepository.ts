
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';
import { KnowledgeAssetSchema } from '@/lib/schemas';

/**
 * 🏛️ Knowledge Asset Repository
 * Proposito: Abstracción de acceso a la colección 'knowledge_assets'.
 * Implementa Rule #11 (Multi-tenant Harmony).
 */
export class KnowledgeAssetRepository {
    private static COLLECTION = 'knowledge_assets';

    /**
     * Busca un asset por ID.
     */
    static async findById(id: string, session?: any) {
        const collection = await getTenantCollection(this.COLLECTION, session);
        return await collection.findOne({ _id: new ObjectId(id) });
    }

    /**
     * Busca por criterios de deduplicación.
     */
    static async findForDeduplication(query: any, session?: any) {
        const collection = await getTenantCollection(this.COLLECTION, session);
        return await collection.findOne(query, { includeDeleted: true });
    }

    /**
     * Inserta un nuevo asset validado.
     */
    static async create(data: any, session?: any) {
        const collection = await getTenantCollection(this.COLLECTION, session);
        const validated = KnowledgeAssetSchema.parse(data);
        return await collection.insertOne(validated);
    }

    /**
     * Actualiza un asset por ID.
     */
    static async update(id: string | ObjectId, update: any, session?: any, options: any = {}) {
        const collection = await getTenantCollection(this.COLLECTION, session);
        const filter = { _id: typeof id === 'string' ? new ObjectId(id) : id };
        return await collection.updateOne(filter, update, options);
    }

    /**
     * Elimina físicamente un asset (usar con precaución, preferir soft-delete).
     */
    static async deletePhysical(id: string | ObjectId, session?: any) {
        const collection = await getTenantCollection(this.COLLECTION, session);
        const filter = { _id: typeof id === 'string' ? new ObjectId(id) : id };
        return await collection.deleteOne(filter);
    }
}
