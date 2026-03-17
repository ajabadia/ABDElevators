import { getTenantCollection, TenantSession, SecureCollection, DatabaseType } from '@/lib/db-tenant';
import { EntityId, TenantId } from '@/lib/schemas/common';
import { ObjectId, Document, AnyBulkWriteOperation, Sort, Filter, UpdateFilter, type ClientSession, type UpdateOptions, OptionalUnlessRequiredId, WithId } from 'mongodb';
import { NotFoundError, AppError, ValidationError } from '@/lib/errors';

/**
 * 🛡️ ERA 12: Safe MongoDB Types
 * Permite el uso de Branded Types (EntityId, TenantId) en filtros y actualizaciones
 * sin requerir casts manuales 'as any'.
 */
export type SafeFilter<T> = Filter<T> | Filter<WithId<T>> | any; // 'any' al final es necesario para la flexibilidad de MongoDB pero lo acotamos en métodos
export type SafeUpdate<T> = UpdateFilter<T> | Partial<T> | any;

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
        return await getTenantCollection<T>(this.collectionName, session, this.clusterName) as unknown as SecureCollection<T>;
    }

    /**
     * Busca un documento por su ID.
     */
    async findById(id: EntityId | ObjectId | string, session?: TenantSession | null, mongoSession?: ClientSession): Promise<T | null> {
        const collection = await this.getCollection(session);
        const filter = { _id: this.toObjectId(id) } as SafeFilter<T>;
        return await collection.findOne(filter, { session: mongoSession }) as T | null;
    }

    /**
     * Obtiene un documento por ID o lanza NotFoundError.
     * Fail-fast pattern para Relational Performance.
     */
    async getEntity(id: EntityId | ObjectId | string, session?: TenantSession | null, mongoSession?: ClientSession): Promise<T> {
        const entity = await this.findById(id, session, mongoSession);
        if (!entity) {
            throw new NotFoundError(`${this.collectionName} not found with ID: ${id}`);
        }
        return entity;
    }

    /**
     * Busca un único documento basado en un filtro.
     */
    async findOne(query: SafeFilter<T>, session?: TenantSession | null, mongoSession?: ClientSession): Promise<T | null> {
        const collection = await this.getCollection(session);
        return await collection.findOne(query, { session: mongoSession }) as T | null;
    }

    /**
     * Convierte string a ObjectId si es necesario.
     * Hardened Era 12: Validate format before instantiation to prevent crashes.
     */
    toObjectId(id: EntityId | ObjectId | string): ObjectId {
        if (id instanceof ObjectId) return id;
        if (typeof id !== 'string') {
            // Si no es string ni ObjectId, intentamos convertir pero evitamos 'as any' si es posible
            if (id && (id as any)._bsontype === 'ObjectId') return id as unknown as ObjectId;
            throw new ValidationError(`Unsupported ID type for conversion: ${typeof id}`);
        }

        // MongoDB ObjectId length is 24, also support our system aliases
        const isHex = /^[0-9a-fA-F]{24}$/.test(id);
        const isSystemAlias = /^(platform_master|demo-tenant|abd_global|abd-tenant|system|SYSTEM_STUCK_DETECTOR|system-recovery)$/.test(id);

        if (!isHex && !isSystemAlias) {
            throw new ValidationError(`Invalid ID format for conversion: ${id}`);
        }

        return new ObjectId(id);
    }

    /**
     * Lista documentos basados en un filtro, con soporte para paginación y ordenamiento.
     */
    async list(
        query: SafeFilter<T> = {},
        options: { sort?: Sort, limit?: number, skip?: number } = {},
        session?: TenantSession | null,
        mongoSession?: ClientSession
    ): Promise<T[]> {
        const collection = await this.getCollection(session);
        const cursor = collection.find(query, {
            sort: options.sort || ({ updatedAt: -1 } as Sort),
            limit: options.limit || 50,
            skip: options.skip || 0,
        });

        // Some implementations might return a Promise instead of a Cursor due to db-tenant polyfills
        if (cursor instanceof Promise) {
            return await cursor as T[];
        }
        return await (cursor as any).toArray() as T[];
    }

    /**
     * Inserta un nuevo documento.
     */
    async create(data: Partial<T>, session?: TenantSession | null, mongoSession?: ClientSession): Promise<EntityId> {
        const collection = await this.getCollection(session);
        const result = await collection.insertOne(data as OptionalUnlessRequiredId<T>, { session: mongoSession });
        return result.insertedId.toString() as EntityId;
    }

    /**
     * Actualiza un documento por su ID.
     */
    async update(
        id: EntityId | ObjectId | string,
        update: SafeUpdate<T>,
        session?: TenantSession | null,
        mongoSession?: ClientSession,
        options: UpdateOptions = {}
    ): Promise<boolean> {
        const collection = await this.getCollection(session);
        const filter = { _id: this.toObjectId(id) } as SafeFilter<T>;
        const result = await collection.updateOne(filter, update, { ...options, session: mongoSession });
        return result.matchedCount > 0;
    }

    /**
     * Actualiza un único documento basado en un filtro.
     */
    async updateOne(
        query: SafeFilter<T>,
        update: SafeUpdate<T>,
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
    async softDelete(id: EntityId | ObjectId | string, session?: TenantSession | null, mongoSession?: ClientSession): Promise<boolean> {
        return await this.update(id, { $set: { deletedAt: new Date() } } as SafeUpdate<T>, session, mongoSession);
    }

    /**
     * Elimina un documento por su ID.
     * Soporta borrado lógico (default) o físico (hardDelete).
     */
    async deleteEntity(
        id: EntityId | ObjectId | string,
        session?: TenantSession | null,
        hardDelete: boolean = false,
        mongoSession?: ClientSession
    ): Promise<boolean> {
        if (!hardDelete) {
            return await this.softDelete(id, session, mongoSession);
        }
        const collection = await this.getCollection(session);
        const filter = { _id: this.toObjectId(id) } as SafeFilter<T>;
        const result = await collection.deleteOne(filter, { session: mongoSession });
        return result.deletedCount > 0;
    }

    /**
     * Cuenta documentos basados en un filtro.
     */
    async count(query: SafeFilter<T> = {}, session?: TenantSession | null): Promise<number> {
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
        query: SafeFilter<T>,
        session?: TenantSession | null,
        hardDelete: boolean = false,
        mongoSession?: ClientSession
    ): Promise<number> {
        const collection = await this.getCollection(session);

        if (hardDelete) {
            const result = await collection.deleteMany(query as SafeFilter<T>, { session: mongoSession });
            return result.deletedCount;
        } else {
            const result = await collection.updateMany(query as SafeFilter<T>, {
                $set: { deletedAt: new Date() }
            } as SafeUpdate<T>, { session: mongoSession });
            return result.modifiedCount;
        }
    }

    /**
     * 🛡️ ERA 12: Validate Exists
     * Comprueba si un registro existe en otra colección antes de persistir.
     * @param targetCluster - Override to look up the FK in a different cluster (e.g., 'AUTH' for users).
     */
    async validateExists(
        targetCollection: string,
        id: EntityId | ObjectId | string | undefined,
        session?: TenantSession | null,
        mongoSession?: ClientSession,
        targetCluster?: DatabaseType
    ): Promise<void> {
        if (!id) return;

        // Obtenemos una instancia segura de la colección objetivo
        const cluster = targetCluster || this.clusterName;
        const collection = await getTenantCollection<any>(targetCollection, session, cluster);
        const exists = await collection.findOne({ _id: this.toObjectId(id) } as SafeFilter<any>, { session: mongoSession });

        if (!exists) {
            throw new AppError('VALIDATION_ERROR', 400, `Relational Integrity Error: ${targetCollection} with ID ${id} not found.`);
        }
    }

    /**
     * Executes a tubería de agregación sobre la colección protegida.
     */
    async aggregate(
        pipeline: any[],
        session?: TenantSession | null,
        mongoSession?: ClientSession
    ): Promise<any[]> {
        const collection = await this.getCollection(session);
        return await collection.aggregate(pipeline, { session: mongoSession });
    }

    /**
     * Alias for count to match common MongoDB expectations in services.
     */
    async countDocuments(query: SafeFilter<T> = {}, session?: TenantSession | null): Promise<number> {
        return await this.count(query, session);
    }

    /**
     * Simple find that returns all results as an array.
     */
    async find(
        query: SafeFilter<T> = {},
        options: { sort?: Sort, limit?: number, skip?: number } = {},
        session?: TenantSession | null
    ): Promise<T[]> {
        return await this.list(query, options, session);
    }
}
