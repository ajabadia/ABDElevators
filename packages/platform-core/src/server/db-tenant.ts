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
    ClientSession,
    AnyBulkWriteOperation
} from 'mongodb';
import { connectDB, connectLogsDB, connectAuthDB, connectConfigDB, getMongoClient } from './db';
import { AppError } from '../errors';
import { logEvento } from './logger';
import { UserRole } from '../types/roles';
export { UserRole };

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
    session?: ClientSession;
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
                } as Filter<T>;
            } else if (isGlobalAllowed) {
                const incomingFilter = baseFilter as Record<string, unknown>;
                const incomingTenantId = incomingFilter.tenantId;
                const allowedSet = [...this.allowedTenants, 'abd_global'];

                if (incomingTenantId && typeof incomingTenantId === 'string') {
                    if (!allowedSet.includes(incomingTenantId)) {
                        baseFilter = { ...baseFilter, tenantId: { $in: allowedSet } } as Filter<T>;
                    }
                } else {
                    baseFilter = { ...baseFilter, tenantId: { $in: allowedSet } } as Filter<T>;
                }
            } else if (this.allowedTenants.length > 1) {
                baseFilter = { ...baseFilter, tenantId: { $in: this.allowedTenants } } as Filter<T>;
            } else {
                baseFilter = { ...baseFilter, tenantId: this.primaryTenantId } as Filter<T>;
            }
        }

        if (this.useSoftDeletes && !includeDeleted) {
            baseFilter = { ...baseFilter, deletedAt: { $exists: false } } as Filter<T>;
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

    async distinct(key: string, filter: Filter<T> = {}, options?: { includeDeleted?: boolean }) {
        return this.collection.distinct(key, this.applyTenantFilter(filter, options?.includeDeleted));
    }

    async aggregate<A extends Document>(pipeline: Document[], options?: FindOptions): Promise<A[]> {
        const tenantStep: Document = { $match: this.applyTenantFilter({}) };
        return this.collection.aggregate<A>([tenantStep, ...pipeline], options).toArray();
    }

    async insertOne(doc: OptionalUnlessRequiredId<T>, options?: InsertOneOptions) {
        const isGlobalAllowed = ['document_types', 'translations', 'file_blobs', 'spaces'].includes(this.collection.collectionName);
        const incomingDoc = doc as Record<string, unknown>;
        const incomingTenantId = incomingDoc.tenantId;

        const finalTenantId = (this.isSuperAdmin && incomingTenantId && typeof incomingTenantId === 'string')
            ? incomingTenantId
            : (isGlobalAllowed && incomingTenantId === 'abd_global')
                ? 'abd_global'
                : this.primaryTenantId;

        const secureDoc = {
            ...doc,
            tenantId: finalTenantId,
            ownerUserId: (incomingDoc.ownerUserId as string) || this.session?.user?.id,
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
        const updateObj = update as Record<string, unknown>;
        const finalUpdate = updateObj.$set || updateObj.$push || updateObj.$pull || updateObj.$inc
            ? update
            : { $set: update };

        const finalUpdateObj = finalUpdate as Record<string, any>; // Partial use of any inside logic to handle MongoDB dynamic operators safely
        if (finalUpdateObj.$set) {
            finalUpdateObj.$set.updatedAt = new Date();
        } else {
            finalUpdateObj.$set = { updatedAt: new Date() };
        }

        return this.collection.updateOne(this.applyTenantFilter(filter, options?.includeDeleted), finalUpdate as UpdateFilter<T>, options);
    }

    async updateMany(filter: Filter<T>, update: UpdateFilter<T> | Partial<T>, options?: UpdateOptions & { includeDeleted?: boolean }) {
        return this.collection.updateMany(this.applyTenantFilter(filter, options?.includeDeleted), update as UpdateFilter<T>, options);
    }

    async findOneAndUpdate(filter: Filter<T>, update: UpdateFilter<T>, options: FindOneAndUpdateOptions = {}) {
        return this.collection.findOneAndUpdate(this.applyTenantFilter(filter), update, options);
    }

    async bulkWrite(operations: AnyBulkWriteOperation<T>[], options?: BulkWriteOptions) {
        return this.collection.bulkWrite(operations, options);
    }

    async deleteOne(filter: Filter<T>, options?: { hardDelete?: boolean } & DeleteOptions) {
        if (options?.hardDelete) {
            return this.collection.deleteOne(this.applyTenantFilter(filter), options);
        }
        const result = await this.collection.updateOne(
            this.applyTenantFilter(filter),
            { $set: { deletedAt: new Date(), updatedAt: new Date() } } as unknown as UpdateFilter<T>
        );
        return {
            acknowledged: result.acknowledged,
            deletedCount: result.modifiedCount
        };
    }

    async deleteMany(filter: Filter<T>, options?: { hardDelete?: boolean } & DeleteOptions) {
        if (options?.hardDelete) {
            return this.collection.deleteMany(this.applyTenantFilter(filter), options);
        }
        const result = await this.collection.updateMany(
            this.applyTenantFilter(filter),
            { $set: { deletedAt: new Date(), updatedAt: new Date() } } as unknown as UpdateFilter<T>
        );
        return {
            acknowledged: result.acknowledged,
            deletedCount: result.modifiedCount
        };
    }

    /**
     * 🔍 VALIDATE EXISTS (ERA 12)
     * Validates that a reference (FK) exists in this collection.
     * Respects tenant isolation automatically.
     */
    async validateExists(id: string | undefined | null, fieldName: string = 'id'): Promise<void> {
        if (!id) return;
        const exists = await this.findOne({ _id: id } as any);
        if (!exists) {
            throw new AppError('VALIDATION_ERROR', 400, `Referencia inválida: ${fieldName} '${id}' no existe o no es accesible.`);
        }
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
        let result: R | undefined;
        await session.withTransaction(async () => {
            result = await fn(session);
        });
        if (result === undefined) {
            throw new AppError('INTERNAL_ERROR', 500, 'Transaction result is undefined');
        }
        return result;
    } finally {
        await session.endSession();
    }
}

export type DatabaseType = 'MAIN' | 'LOGS' | 'AUTH' | 'CONFIG';

export async function getTenantCollection<T extends Document>(
    collectionName: string,
    providedSession?: TenantSession | null,
    dbType: DatabaseType = 'MAIN',
    options: { softDeletes?: boolean } = {}
): Promise<SecureCollection<T>> {
    const session = providedSession;

    const hasValidSession = session && session.user && session.user.tenantId;
    const isSingleTenantMode = !!process.env.SINGLE_TENANT_ID;

    let effectiveDbType = dbType;
    if (
        collectionName === 'users' ||
        collectionName === 'v2_users' ||
        collectionName === 'tenants' ||
        collectionName === 'permission_groups' ||
        collectionName === 'mfa_configs' ||
        collectionName === 'api_keys' ||
        collectionName === 'sessions' ||
        collectionName === 'magic_links'
    ) {
        effectiveDbType = 'AUTH';
    } else if (
        collectionName === 'application_logs' ||
        collectionName === 'usage_logs' ||
        collectionName === 'audit_trails' ||
        collectionName === 'audit_config_changes' ||
        collectionName === 'audit_admin_ops' ||
        collectionName === 'audit_data_access' ||
        collectionName === 'audit_ingestion' ||
        collectionName === 'notification_templates' ||
        collectionName === 'notifications' ||
        collectionName === 'notification_configs' ||
        collectionName === 'ai_corrections' ||
        collectionName === 'workflow_executions' ||
        collectionName === 'workflow_logs' ||
        collectionName === 'workflow_analytics' ||
        collectionName === 'rag_query_logs' ||
        collectionName === 'rag_evaluations'
    ) {
        effectiveDbType = 'LOGS';
    } else if (
        collectionName === 'translations' ||
        collectionName === 'document_types' ||
        collectionName === 'spaces' ||
        collectionName === 'prompts' ||
        collectionName === 'feature_flags' ||
        collectionName === 'application_configs' ||
        collectionName === 'kb_models_registry' ||
        collectionName === 'pricing_plans' ||
        collectionName === 'ai_configs' ||
        collectionName === 'tenant_configs' ||
        collectionName === 'workflow_configs' ||
        collectionName === 'workflow_definitions' ||
        collectionName === 'ai_workflows' ||
        collectionName === 'prompt_versions' ||
        collectionName === 'federated_patterns' ||
        collectionName === 'policies' ||
        collectionName === 'taxonomies' ||
        collectionName === 'agent_checkpoints' ||
        collectionName === 'checklist_configs' ||
        collectionName === 'organizations'
    ) {
        effectiveDbType = 'CONFIG';
    }

    if (hasValidSession || isSingleTenantMode || collectionName === 'translations') {
        let db;
        if (effectiveDbType === 'LOGS') {
            db = await connectLogsDB();
        } else if (effectiveDbType === 'AUTH') {
            db = await connectAuthDB();
        } else if (effectiveDbType === 'CONFIG') {
            db = await connectConfigDB();
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

/**
 * Helper para obtener la colección de Casos (unificada)
 */
export async function getCaseCollection(session: TenantSession, options?: { softDeletes?: boolean }) {
    return getTenantCollection('cases', session, 'MAIN', options);
}

/**
 * Helper para obtener la colección de Notificaciones
 */
export async function getNotificationCollection(session: TenantSession, options?: { softDeletes?: boolean }) {
    return getTenantCollection('notifications', session, 'LOGS', options);
}

/**
 * Helper para obtener la colección de Configuración de Notificaciones
 */
export async function getNotificationConfigCollection(session: TenantSession, options?: { softDeletes?: boolean }) {
    return getTenantCollection('notification_configs', session, 'LOGS', options);
}

/**
 * Helper para obtener la colección de Auditoría (Audit Trails)
 */
export async function getAuditTrailCollection(session: TenantSession, options?: { softDeletes?: boolean }) {
    return getTenantCollection('audit_trails', session, 'LOGS', options);
}
