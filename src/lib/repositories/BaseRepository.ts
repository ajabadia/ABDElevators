import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId, Document, AnyBulkWriteOperation } from 'mongodb';

/**
 * 🏛️ BaseRepository
 * Clase base abstracta para repositorios en ABD RAG Platform (Era 7).
 * Provee métodos estandarizados con aislamiento multi-tenant implícito.
 */
export abstract class BaseRepository<T extends Document> {
    protected abstract readonly collectionName: string;

    /**
     * Obtiene la colección de MongoDB con aislamiento de tenant.
     */
    protected async getCollection(session?: any): Promise<any> {
        return await getTenantCollection<T>(this.collectionName, session);
    }

    /**
     * Busca un documento por su ID.
     */
    async findById(id: string | ObjectId, session?: any): Promise<T | null> {
        const collection = await this.getCollection(session);
        const filter = { _id: typeof id === 'string' ? new ObjectId(id) : id } as any;
        return await collection.findOne(filter) as unknown as T | null;
    }

    /**
     * Lista documentos basados en un filtro, con soporte para paginación y ordenamiento.
     */
    async list(query: any = {}, options: { sort?: any, limit?: number, skip?: number } = {}, session?: any) {
        const collection = await this.getCollection(session);
        return await collection.find(query, {
            sort: options.sort || { updatedAt: -1 },
            limit: options.limit || 50,
            skip: options.skip || 0
        }).toArray() as unknown as T[];
    }

    /**
     * Inserta un nuevo documento.
     */
    async create(data: Partial<T>, session?: any): Promise<string> {
        const collection = await this.getCollection(session);
        const result = await collection.insertOne(data as any, { session });
        return result.insertedId.toString();
    }

    /**
     * Actualiza un documento por su ID.
     */
    async update(id: string | ObjectId, update: any, session?: any): Promise<boolean> {
        const collection = await this.getCollection(session);
        const filter = { _id: typeof id === 'string' ? new ObjectId(id) : id } as any;
        const result = await collection.updateOne(filter, update, { session });
        return result.matchedCount > 0;
    }

    /**
     * Borrado lógico (Soft Delete) - Recomendado por regla #11.
     */
    async softDelete(id: string | ObjectId, session?: any): Promise<boolean> {
        return await this.update(id, { $set: { deletedAt: new Date() } }, session);
    }

    /**
     * Cuenta documentos basados en un filtro.
     */
    async count(query: any = {}, session?: any): Promise<number> {
        const collection = await this.getCollection(session);
        return await collection.countDocuments(query, { session });
    }

    /**
     * Operaciones masivas (Bulk Write).
     */
    async bulkWrite(operations: AnyBulkWriteOperation<T>[], session?: any) {
        const collection = await this.getCollection(session);
        return await collection.bulkWrite(operations, { session });
    }
}
