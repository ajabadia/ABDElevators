import {
    Collection,
    Filter,
    UpdateFilter,
    Document,
    FindOptions,
    InsertOneOptions,
    UpdateOptions,
    DeleteOptions,
    BulkWriteOptions,
    OptionalUnlessRequiredId,
    FindOneAndUpdateOptions,
    ClientSession
} from 'mongodb';
import { connectDB, connectLogsDB, getMongoClient } from '@/lib/db';
import { auth } from './auth';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';

/**
 * Interface para el contexto de sesión necesario para el aislamiento.
 */
export interface TenantSession {
    user?: {
        id: string;
        email: string;
        tenantId: string;
        role: string;
        tenantAccess?: { tenantId: string }[];
    }
}

/**
 * Wrapper seguro sobre la colección de MongoDB que garantiza el aislamiento Multi-tenant.
 * Implementa características "Pro": Soft Deletes, Atomic Updates y soporte de Transacciones.
 */
export class SecureCollection<T extends Document> {
    private readonly collection: Collection<T>;
    private readonly primaryTenantId: string;
    private readonly allowedTenants: string[];
    private readonly isSuperAdmin: boolean;
    private readonly useSoftDeletes: boolean;

    public get tenantId(): string {
        return this.primaryTenantId;
    }

    public get isPlatformAdmin(): boolean {
        return this.isSuperAdmin;
    }

    constructor(collection: Collection<T>, session: any, options: { softDeletes?: boolean } = {}) {
        this.collection = collection;
        this.primaryTenantId = session?.user?.tenantId || process.env.SINGLE_TENANT_ID || 'unknown';
        this.isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';
        this.useSoftDeletes = options.softDeletes ?? true; // Por defecto usamos soft deletes para seguridad de datos

        const accessList = (session?.user?.tenantAccess || []).map((a: any) => a.tenantId);
        this.allowedTenants = Array.from(new Set([this.primaryTenantId, ...accessList])).filter(Boolean);

        if (this.isSuperAdmin && !session?.user?.tenantId) {
            this.primaryTenantId = 'platform_master';
        }
    }

    /**
     * Aplica el filtrado de tenant y de soft delete a cualquier query.
     */
    private applyTenantFilter(filter: Filter<T> = {}, includeDeleted = false): Filter<T> {
        let baseFilter: Filter<T> = { ...filter };

        // 1. Aislamiento Multi-tenant
        if (!(this.isSuperAdmin && this.primaryTenantId === 'platform_master')) {
            if (this.allowedTenants.length > 1) {
                baseFilter = { ...baseFilter, tenantId: { $in: this.allowedTenants } } as any;
            } else {
                baseFilter = { ...baseFilter, tenantId: this.primaryTenantId } as any;
            }
        }

        // 2. Soft Delete Filter
        if (this.useSoftDeletes && !includeDeleted) {
            baseFilter = { ...baseFilter, deletedAt: { $exists: false } } as any;
        }

        return baseFilter;
    }

    // --- READ OPERATIONS ---

    async find(filter: Filter<T> = {}, options?: FindOptions & { includeDeleted?: boolean }) {
        return this.collection.find(this.applyTenantFilter(filter, options?.includeDeleted), options).toArray();
    }

    async findOne(filter: Filter<T> = {}, options?: FindOptions & { includeDeleted?: boolean }) {
        return this.collection.findOne(this.applyTenantFilter(filter, options?.includeDeleted), options);
    }

    async countDocuments(filter: Filter<T> = {}, options?: { includeDeleted?: boolean }) {
        return this.collection.countDocuments(this.applyTenantFilter(filter, options?.includeDeleted));
    }

    async aggregate<A extends Document>(pipeline: any[], options?: any): Promise<A[]> {
        // Inyectamos el filtro de tenant como primer paso del pipeline para seguridad
        const tenantStep = { $match: this.applyTenantFilter({}) };
        return this.collection.aggregate<A>([tenantStep, ...pipeline], options).toArray();
    }

    // --- WRITE OPERATIONS ---

    async insertOne(doc: OptionalUnlessRequiredId<T>, options?: InsertOneOptions) {
        const secureDoc = {
            ...doc,
            tenantId: this.primaryTenantId,
            createdAt: new Date(),
            updatedAt: new Date()
        } as OptionalUnlessRequiredId<T>;
        return this.collection.insertOne(secureDoc, options);
    }

    async insertMany(docs: OptionalUnlessRequiredId<T>[], options?: BulkWriteOptions) {
        const now = new Date();
        const secureDocs = docs.map(d => ({
            ...d,
            tenantId: this.primaryTenantId,
            createdAt: now,
            updatedAt: now
        } as OptionalUnlessRequiredId<T>));
        return this.collection.insertMany(secureDocs, options);
    }

    async updateOne(filter: Filter<T>, update: UpdateFilter<T> | Partial<T>, options?: UpdateOptions) {
        const finalUpdate = (update as any).$set || (update as any).$push || (update as any).$pull || (update as any).$inc
            ? update
            : { $set: update };

        // Forzar actualización de updatedAt
        if ((finalUpdate as any).$set) {
            (finalUpdate as any).$set.updatedAt = new Date();
        } else {
            (finalUpdate as any).$set = { updatedAt: new Date() };
        }

        return this.collection.updateOne(this.applyTenantFilter(filter), finalUpdate as UpdateFilter<T>, options);
    }

    async updateMany(filter: Filter<T>, update: UpdateFilter<T> | Partial<T>, options?: UpdateOptions) {
        return this.collection.updateMany(this.applyTenantFilter(filter), update, options);
    }

    async findOneAndUpdate(filter: Filter<T>, update: UpdateFilter<T>, options: FindOneAndUpdateOptions = {}) {
        return this.collection.findOneAndUpdate(this.applyTenantFilter(filter), update, options);
    }

    // --- DELETE OPERATIONS (SOFT BY DEFAULT) ---

    async deleteOne(filter: Filter<T>, options?: { hardDelete?: boolean } & DeleteOptions) {
        if (options?.hardDelete) {
            return this.collection.deleteOne(this.applyTenantFilter(filter), options);
        }
        // Soft Delete
        return this.collection.updateOne(
            this.applyTenantFilter(filter),
            { $set: { deletedAt: new Date(), updatedAt: new Date() } } as any
        );
    }

    async deleteMany(filter: Filter<T>, options?: { hardDelete?: boolean } & DeleteOptions) {
        if (options?.hardDelete) {
            return this.collection.deleteMany(this.applyTenantFilter(filter), options);
        }
        // Soft Delete
        return this.collection.updateMany(
            this.applyTenantFilter(filter),
            { $set: { deletedAt: new Date(), updatedAt: new Date() } } as any
        );
    }

    /**
     * Acceso de "emergencia" a la colección raw (Solo SUPER_ADMIN)
     */
    get unsecureRawCollection() {
        if (!this.isSuperAdmin) {
            throw new AppError('FORBIDDEN', 403, 'Acceso raw denegado (Multi-tenant Guard)');
        }
        return this.collection;
    }
}

/**
 * Helper para ejecutar operaciones en una transacción ACID.
 */
export async function withTransaction<R>(fn: (session: ClientSession) => Promise<R>): Promise<R> {
    const client = await getMongoClient();
    const session = client.startSession();
    try {
        let result: R = undefined as any;
        await session.withTransaction(async () => {
            result = await fn(session);
        });
        return result;
    } finally {
        await session.endSession();
    }
}

export type DatabaseType = 'MAIN' | 'LOGS';

/**
 * Obtiene una colección protegida por el contexto de sesión.
 */
export async function getTenantCollection<T extends Document>(
    collectionName: string,
    providedSession?: any,
    dbType: DatabaseType = 'MAIN',
    options: { softDeletes?: boolean } = {}
): Promise<SecureCollection<T>> {
    let session = providedSession;

    if (!session) {
        try {
            session = await auth();
        } catch (e) {
            console.warn('[db-tenant] Failed to retrieve session from auth()', e);
        }
    }

    // 🛡️ REGLA DE ORO #9: Hardening Multi-tenant
    // Si no hay sesión y no estamos en modo Single Tenant, BLOQUEO TOTAL.
    if (!session?.user && !process.env.SINGLE_TENANT_ID) {
        const errorMsg = `Aislamiento de Tenant fallido para '${collectionName}': Contexto no encontrado`;
        console.error(`[SECURITY ALERT] ${errorMsg}`);

        // Auditamos el fallo si es posible (Fire-and-forget)
        logEvento({
            level: 'ERROR',
            source: 'DB_TENANT',
            action: 'ISOLATION_FAILURE',
            message: errorMsg,
            correlationId: 'security-fault'
        }).catch(() => { });

        throw new AppError('UNAUTHORIZED', 401, errorMsg);
    }

    const db = dbType === 'LOGS' ? await connectLogsDB() : await connectDB();

    const rawCollection = db.collection<T>(collectionName);
    return new SecureCollection<T>(rawCollection, session, options);
}

export async function getCaseCollection(session?: any) {
    return await getTenantCollection('cases', session);
}

export async function getEntityCollection(session?: any) {
    return await getTenantCollection('entities', session);
}

export async function getKnowledgeAssetCollection(session?: any) {
    return await getTenantCollection('knowledge_assets', session);
}
