import { getTenantCollection, TenantSession } from '@/lib/db-tenant';
import { ObjectId, Document, AnyBulkWriteOperation, Sort, Filter, UpdateFilter, type ClientSession, type UpdateOptions } from 'mongodb';

/**
 * 🏛️ BaseRepository
 * Clase base abstracta para repositorios en ABD RAG Platform (Era 7).
 * Provee métodos estandarizados con aislamiento multi-tenant implícito.
 * Hardened Era 8: Strict types and transaction support.
 */
export abstract class BaseRepository<T extends Document> {
    protected abstract readonly collectionName: string;
    protected readonly clusterName?: string;

    /**
     * Obtiene la colección de MongoDB con aislamiento de tenant.
     */
    protected async getCollection(session?: TenantSession | null): Promise<any> {
        return await getTenantCollection<T>(this.collectionName, session, this.clusterName as any);
    }

    /**
     * Busca un documento por su ID.
     */
    async findById(id: string | ObjectId, session?: TenantSession | null, mongoSession?: ClientSession): Promise<T | null> {
        const collection = await this.getCollection(session);
        const filter = { _id: this.toObjectId(id) } as unknown as Filter<T>;
        return await collection.findOne(filter, { session: mongoSession }) as unknown as T | null;
    }

    /**
     * Busca un único documento basado en un filtro.
     */
    async findOne(query: Filter<T>, session?: TenantSession | null, mongoSession?: ClientSession): Promise<T | null> {
        const collection = await this.getCollection(session);
        return await collection.findOne(query, { session: mongoSession }) as unknown as T | null;
    }

    /**
     * Convierte string a ObjectId si es necesario.
     */
    toObjectId(id: string | ObjectId): ObjectId {
        return typeof id === 'string' ? new ObjectId(id) : id;
    }

    /**
     * Lista documentos basados en un filtro, con soporte para paginación y ordenamiento.
     */
    async list(
        query: Filter<T> = {},
        options: { sort?: Sort, limit?: number, skip?: number } = {},
        session?: TenantSession | null,
        mongoSession?: ClientSession
    ) {
        const collection = await this.getCollection(session);
        return await collection.find(query, {
            sort: options.sort || { updatedAt: -1 } as Sort,
            limit: options.limit || 50,
            skip: options.skip || 0,
            session: mongoSession
        }).toArray() as unknown as T[];
    }

    /**
     * Inserta un nuevo documento.
     */
    async create(data: Partial<T>, session?: TenantSession | null, mongoSession?: ClientSession): Promise<string> {
        const collection = await this.getCollection(session);
        const result = await collection.insertOne(data as any, { session: mongoSession });
        return result.insertedId.toString();
    }

    /**
     * Actualiza un documento por su ID.
     */
    async update(
        id: string | ObjectId,
        update: UpdateFilter<T>,
        session?: TenantSession | null,
        mongoSession?: ClientSession,
        options: UpdateOptions = {}
    ): Promise<boolean> {
        const collection = await this.getCollection(session);
        const filter = { _id: typeof id === 'string' ? new ObjectId(id) : id } as unknown as Filter<T>;
        const result = await collection.updateOne(filter, update, { ...options, session: mongoSession });
        return result.matchedCount > 0;
    }

    /**
     * Borrado lógico (Soft Delete) - Recomendado por regla #11.
     */
    async softDelete(id: string | ObjectId, session?: TenantSession | null, mongoSession?: ClientSession): Promise<boolean> {
        return await this.update(id, { $set: { deletedAt: new Date() } } as unknown as UpdateFilter<T>, session, mongoSession);
    }

    /**
     * Cuenta documentos basados en un filtro.
     */
    async count(query: Filter<T> = {}, session?: TenantSession | null, mongoSession?: ClientSession): Promise<number> {
        const collection = await this.getCollection(session);
        return await collection.countDocuments(query, { session: mongoSession });
    }

    /**
     * Operaciones masivas (Bulk Write).
     */
    async bulkWrite(operations: AnyBulkWriteOperation<T>[], session?: TenantSession | null, mongoSession?: ClientSession) {
        const collection = await this.getCollection(session);
        return await collection.bulkWrite(operations, { session: mongoSession });
    }

    /**
     * Elimina múltiples documentos basados en un filtro.
     * Soporta borrado lógico (default) o físico (hardDelete).
     */
    async deleteMany(
        query: Filter<T>,
        session?: TenantSession | null,
        hardDelete: boolean = false,
        mongoSession?: ClientSession
    ): Promise<number> {
        const collection = await this.getCollection(session);

        if (hardDelete) {
            const result = await collection.deleteMany(query, { session: mongoSession });
            return result.deletedCount;
        } else {
            const result = await collection.updateMany(query, {
                $set: { deletedAt: new Date() }
            } as unknown as UpdateFilter<T>, { session: mongoSession });
            return result.modifiedCount;
        }
    }
}
