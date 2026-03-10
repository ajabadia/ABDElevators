import { getTenantCollection, TenantSession, SecureCollection, DatabaseType } from '@/lib/db-tenant';
import { ObjectId, Document, AnyBulkWriteOperation, Sort, Filter, UpdateFilter, type ClientSession, type UpdateOptions, OptionalUnlessRequiredId } from 'mongodb';
import { NotFoundError } from '@/lib/errors';

/**
 * 🏛️ BaseRepository
 * Clase base abstracta para repositorios en ABD RAG Platform (Era 12).
 * Provee métodos estandarizados con aislamiento multi-tenant implícito.
 * Hardened Era 12: Strict types, transaction support and fail-fast getters.
 */
export abstract class BaseRepository<T extends Document> {
    constructor(
        protected readonly collectionName: string,
        protected readonly clusterName: DatabaseType = 'MAIN'
    ) { }

    /**
     * Obtiene la colección de MongoDB con aislamiento de tenant.
     */
    protected async getCollection(session?: TenantSession | null): Promise<SecureCollection<T>> {
        return await getTenantCollection<T>(this.collectionName, session, this.clusterName);
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
     * Obtiene un documento por ID o lanza NotFoundError.
     * Fail-fast pattern para Relational Performance.
     */
    async getEntity(id: string | ObjectId, session?: TenantSession | null, mongoSession?: ClientSession): Promise<T> {
        const entity = await this.findById(id, session, mongoSession);
        if (!entity) {
            throw new NotFoundError(`${this.collectionName} not found with ID: ${id}`);
        }
        return entity;
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
        }) as unknown as T[];
    }

    /**
     * Inserta un nuevo documento.
     */
    async create(data: Partial<T>, session?: TenantSession | null, mongoSession?: ClientSession): Promise<string> {
        const collection = await this.getCollection(session);
        const result = await collection.insertOne(data as OptionalUnlessRequiredId<T>, { session: mongoSession });
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
     * Actualiza un único documento basado en un filtro.
     */
    async updateOne(
        query: Filter<T>,
        update: UpdateFilter<T>,
        session?: TenantSession | null,
        mongoSession?: ClientSession,
        options: UpdateOptions = {}
    ): Promise<{ matchedCount: number, modifiedCount: number, upsertedId?: ObjectId }> {
        const collection = await this.getCollection(session);
        const result = await collection.updateOne(query, update, { ...options, session: mongoSession });
        return {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
            upsertedId: result.upsertedId as ObjectId
        };
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
        return await collection.countDocuments(query);
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
