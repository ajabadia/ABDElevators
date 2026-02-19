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
import { connectDB, connectLogsDB, connectAuthDB, getMongoClient } from './db';
import { AppError } from '../errors';
import { logEvento } from './logger';
import { UserRole } from '../types/roles';

/**
 * Interface para el contexto de sesión necesario para el aislamiento.
 */
export interface TenantSession {
    user?: {
        id: string;
        email?: string | null;
        tenantId: string;
        role: string;
        tenantAccess?: { tenantId: string }[];
        accessibleSpaces?: string[];
    }
}

/**
 * Wrapper seguro sobre la colección de MongoDB que garantiza el aislamiento Multi-tenant.
 */
export class SecureCollection<T extends Document> {
    private readonly collection: Collection<T>;
    private readonly primaryTenantId: string;
    private readonly allowedTenants: string[];
    private readonly isSuperAdmin: boolean;
    private readonly useSoftDeletes: boolean;
    private readonly session: TenantSession;

    public get tenantId(): string {
        return this.primaryTenantId;
    }

    public get isPlatformAdmin(): boolean {
        return this.isSuperAdmin;
    }

    constructor(collection: Collection<T>, session: TenantSession, options: { softDeletes?: boolean } = {}) {
        this.collection = collection;
        this.primaryTenantId = session?.user?.tenantId || process.env.SINGLE_TENANT_ID || 'unknown';
        this.isSuperAdmin = session?.user?.role === UserRole.SUPER_ADMIN;
        this.useSoftDeletes = options.softDeletes ?? true;
        this.session = session;

        const accessList = (session?.user?.tenantAccess || []).map((a) => a.tenantId);
        this.allowedTenants = Array.from(new Set([this.primaryTenantId, ...accessList])).filter(Boolean);

        if (this.isSuperAdmin && (!session?.user?.tenantId || session?.user?.tenantId === 'unknown')) {
            this.primaryTenantId = 'platform_master';
        }
    }

    private applyTenantFilter(filter: Filter<T> = {}, includeDeleted = false): Filter<T> {
        let baseFilter: Filter<T> = { ...filter };

        if (!this.isSuperAdmin) {
            const globalAllowedCollections = ['document_types', 'translations', 'file_blobs', 'spaces'];
            const isGlobalAllowed = globalAllowedCollections.includes(this.collection.collectionName);

            if (this.collection.collectionName === 'knowledge_assets') {
                const userId = this.session?.user?.id || 'unknown';
                baseFilter = {
                    ...baseFilter,
                    tenantId: { $in: [...this.allowedTenants, 'abd_global'] },
                    $or: [
                        { spaceId: { $exists: false } },
                        { spaceId: { $in: this.session?.user?.accessibleSpaces || [] } },
                        { ownerUserId: userId }
                    ]
                } as any;
            } else if (isGlobalAllowed) {
                const incomingTenantId = (baseFilter as any).tenantId;
                const allowedSet = [...this.allowedTenants, 'abd_global'];

                if (incomingTenantId && typeof incomingTenantId === 'string') {
                    if (!allowedSet.includes(incomingTenantId)) {
                        baseFilter = { ...baseFilter, tenantId: { $in: allowedSet } } as any;
                    }
                } else {
                    baseFilter = { ...baseFilter, tenantId: { $in: allowedSet } } as any;
                }
            } else if (this.allowedTenants.length > 1) {
                baseFilter = { ...baseFilter, tenantId: { $in: this.allowedTenants } } as any;
            } else {
                baseFilter = { ...baseFilter, tenantId: this.primaryTenantId } as any;
            }
        }

        if (this.useSoftDeletes && !includeDeleted) {
            baseFilter = { ...baseFilter, deletedAt: { $exists: false } } as any;
        }

        return baseFilter;
    }

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
        const tenantStep = { $match: this.applyTenantFilter({}) };
        return this.collection.aggregate<A>([tenantStep, ...pipeline], options).toArray();
    }

    async insertOne(doc: OptionalUnlessRequiredId<T>, options?: InsertOneOptions) {
        const isGlobalAllowed = ['document_types', 'translations', 'file_blobs', 'spaces'].includes(this.collection.collectionName);
        const incomingTenantId = (doc as any).tenantId;

        const finalTenantId = (this.isSuperAdmin && incomingTenantId)
            ? incomingTenantId
            : (isGlobalAllowed && incomingTenantId === 'abd_global')
                ? 'abd_global'
                : this.primaryTenantId;

        const secureDoc = {
            ...doc,
            tenantId: finalTenantId,
            ownerUserId: (doc as any).ownerUserId || this.session?.user?.id,
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

    async updateOne(filter: Filter<T>, update: UpdateFilter<T> | Partial<T>, options?: UpdateOptions & { includeDeleted?: boolean }) {
        const finalUpdate = (update as any).$set || (update as any).$push || (update as any).$pull || (update as any).$inc
            ? update
            : { $set: update };

        if ((finalUpdate as any).$set) {
            (finalUpdate as any).$set.updatedAt = new Date();
        } else {
            (finalUpdate as any).$set = { updatedAt: new Date() };
        }

        return this.collection.updateOne(this.applyTenantFilter(filter, options?.includeDeleted), finalUpdate as UpdateFilter<T>, options);
    }

    async updateMany(filter: Filter<T>, update: UpdateFilter<T> | Partial<T>, options?: UpdateOptions & { includeDeleted?: boolean }) {
        return this.collection.updateMany(this.applyTenantFilter(filter, options?.includeDeleted), update, options);
    }

    async findOneAndUpdate(filter: Filter<T>, update: UpdateFilter<T>, options: FindOneAndUpdateOptions = {}) {
        return this.collection.findOneAndUpdate(this.applyTenantFilter(filter), update, options);
    }

    async bulkWrite(operations: any[], options?: BulkWriteOptions) {
        return this.collection.bulkWrite(operations, options);
    }

    async deleteOne(filter: Filter<T>, options?: { hardDelete?: boolean } & DeleteOptions) {
        if (options?.hardDelete) {
            return this.collection.deleteOne(this.applyTenantFilter(filter), options);
        }
        return this.collection.updateOne(
            this.applyTenantFilter(filter),
            { $set: { deletedAt: new Date(), updatedAt: new Date() } } as any
        );
    }

    async deleteMany(filter: Filter<T>, options?: { hardDelete?: boolean } & DeleteOptions) {
        if (options?.hardDelete) {
            return this.collection.deleteMany(this.applyTenantFilter(filter), options);
        }
        return this.collection.updateMany(
            this.applyTenantFilter(filter),
            { $set: { deletedAt: new Date(), updatedAt: new Date() } } as any
        );
    }

    get unsecureRawCollection() {
        if (!this.isSuperAdmin) {
            throw new AppError('FORBIDDEN', 403, 'Acceso raw denegado (Multi-tenant Guard)');
        }
        return this.collection;
    }
}

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

export type DatabaseType = 'MAIN' | 'LOGS' | 'AUTH';

export async function getTenantCollection<T extends Document>(
    collectionName: string,
    providedSession?: TenantSession | null,
    dbType: DatabaseType = 'MAIN',
    options: { softDeletes?: boolean } = {}
): Promise<SecureCollection<T>> {
    let session = providedSession;

    const hasValidSession = session && session.user && session.user.tenantId;
    const isSingleTenantMode = !!process.env.SINGLE_TENANT_ID;

    let effectiveDbType = dbType;
    if (collectionName === 'users' || collectionName === 'v2_users' || collectionName === 'tenants' || collectionName === 'permission_groups' || collectionName === 'mfa_configs') {
        effectiveDbType = 'AUTH';
    } else if (
        collectionName === 'application_logs' ||
        collectionName === 'usage_logs' ||
        collectionName === 'audit_trails' ||
        collectionName === 'audit_config_changes' ||
        collectionName === 'audit_admin_ops' ||
        collectionName === 'audit_data_access' ||
        collectionName === 'notification_templates' ||
        collectionName === 'notifications' ||
        collectionName === 'notification_configs'
    ) {
        effectiveDbType = 'LOGS';
    }

    if (hasValidSession || isSingleTenantMode || collectionName === 'translations') {
        let db;
        if (effectiveDbType === 'LOGS') {
            db = await connectLogsDB();
        } else if (effectiveDbType === 'AUTH') {
            db = await connectAuthDB();
        } else {
            db = await connectDB();
        }

        const rawCollection = db.collection<T>(collectionName);
        const defaultTenantId = process.env.SINGLE_TENANT_ID || 'platform_master';
        const fallbackSession: TenantSession = {
            user: {
                id: 'system',
                tenantId: defaultTenantId,
                role: isSingleTenantMode ? 'ADMIN' : 'GUEST'
            }
        };
        const effectiveSession = (session as TenantSession) || fallbackSession;

        return new SecureCollection<T>(rawCollection, effectiveSession, options);
    }

    const errorMsg = `Aislamiento de Tenant fallido para '${collectionName}': Contexto no encontrado`;
    console.error(`[SECURITY ALERT] ${errorMsg}`);
    throw new AppError('UNAUTHORIZED', 401, errorMsg);
}
