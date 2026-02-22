
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId, Filter, UpdateFilter, FindOptions, InsertOneOptions, UpdateOptions, DeleteOptions } from 'mongodb';

/**
 * 🏛️ Base Repository
 * Proposito: Abstracción base para el acceso a datos multi-tenant.
 * Implementa Rule #11 (Multi-tenant Harmony).
 */
export abstract class BaseRepository<T extends { _id?: ObjectId | string }> {
    constructor(protected readonly collectionName: string) { }

    /**
     * Obtiene la colección vinculada al tenant actual.
     */
    protected async getCollection(session?: any) {
        return await getTenantCollection<T>(this.collectionName, session);
    }

    /**
     * Busca un documento por ID.
     */
    async findById(id: string | ObjectId, session?: any): Promise<T | null> {
        const collection = await this.getCollection(session);
        const filter = { _id: typeof id === 'string' ? new ObjectId(id) : id } as any;
        return await collection.findOne(filter);
    }

    /**
     * Busca un documento que coincida con el filtro.
     */
    async findOne(filter: Filter<T>, options?: FindOptions, session?: any): Promise<T | null> {
        const collection = await this.getCollection(session);
        return await collection.findOne(filter, options);
    }

    /**
     * Busca múltiples documentos.
     */
    async find(filter: Filter<T> = {}, options?: FindOptions, session?: any): Promise<T[]> {
        const collection = await this.getCollection(session);
        return await collection.find(filter, options) as any;
    }

    /**
     * Inserta un documento.
     */
    async create(data: T, options?: InsertOneOptions, session?: any) {
        const collection = await this.getCollection(session);
        return await collection.insertOne(data as any, options);
    }

    /**
     * Actualiza un documento por ID.
     */
    async update(id: string | ObjectId, update: UpdateFilter<T>, options?: UpdateOptions, session?: any) {
        const collection = await this.getCollection(session);
        const filter = { _id: typeof id === 'string' ? new ObjectId(id) : id } as any;
        return await collection.updateOne(filter, update, options);
    }

    /**
     * Actualiza múltiples documentos.
     */
    async updateMany(filter: Filter<T>, update: UpdateFilter<T>, options?: UpdateOptions, session?: any) {
        const collection = await this.getCollection(session);
        return await collection.updateMany(filter, update, options);
    }

    /**
     * Elimina físicamente un documento (usar con precaución).
     */
    async deletePhysical(id: string | ObjectId, options?: DeleteOptions, session?: any) {
        const collection = await this.getCollection(session);
        const filter = { _id: typeof id === 'string' ? new ObjectId(id) : id } as any;
        return await collection.deleteOne(filter, options);
    }
}
