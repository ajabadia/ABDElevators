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
import { connectDB, connectLogsDB, connectAuthDB, getMongoClient } from '@/lib/db';

import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { UserRole } from '@/types/roles';
import { ReportSchedule } from './schemas/report-schedule';

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
    private readonly session: any; // Added for Phase 125.2 context

    public get tenantId(): string {
        return this.primaryTenantId;
    }

    public get isPlatformAdmin(): boolean {
        return this.isSuperAdmin;
    }

    constructor(collection: Collection<T>, session: any, options: { softDeletes?: boolean } = {}) {
        this.collection = collection;
        this.primaryTenantId = session?.user?.tenantId || process.env.SINGLE_TENANT_ID || 'unknown';
        this.isSuperAdmin = session?.user?.role === UserRole.SUPER_ADMIN;
        this.useSoftDeletes = options.softDeletes ?? true; // Por defecto usamos soft deletes para seguridad de datos
        this.session = session;

        const accessList = (session?.user?.tenantAccess || []).map((a: any) => a.tenantId);
        this.allowedTenants = Array.from(new Set([this.primaryTenantId, ...accessList])).filter(Boolean);

        // Si es SuperAdmin y no tiene un tenant fijo asignado, permitimos acceso global "platform_master"
        // Si tiene uno (ej: aprovisionado), mantendremos isSuperAdmin=true para que el filtro lo libere después.
        if (this.isSuperAdmin && (!session?.user?.tenantId || session?.user?.tenantId === 'unknown')) {
            this.primaryTenantId = 'platform_master';
        }
    }

    /**
     * Aplica el filtrado de tenant y de soft delete a cualquier query.
     */
    private applyTenantFilter(filter: Filter<T> = {}, includeDeleted = false): Filter<T> {
        let baseFilter: Filter<T> = { ...filter };

        // 1. Aislamiento Multi-tenant
        // El SuperAdmin (Auditoría 015) bypassea el filtro de tenant para gestión global
        if (!this.isSuperAdmin) {
            const globalAllowedCollections = ['document_types', 'translations', 'file_blobs', 'spaces'];
            const isGlobalAllowed = globalAllowedCollections.includes(this.collection.collectionName);

            if (this.collection.collectionName === 'knowledge_assets') {
                // 🌌 Phase 125.2: Space-aware isolation for Assets
                const userId = this.session?.user?.id || 'unknown';
                baseFilter = {
                    ...baseFilter,
                    tenantId: { $in: [...this.allowedTenants, 'abd_global'] },
                    $or: [
                        { spaceId: { $exists: false } }, // Legacy fallback
                        { spaceId: { $in: this.session?.user?.accessibleSpaces || [] } }, // Planned for Phase 125.2
                        { ownerUserId: userId } // Personal assets
                    ]
                } as any;
            } else if (isGlobalAllowed) {
                // 🛡️ Si ya hay un filtro por tenantId, validamos que esté en los permitidos.
                // Si no hay, inyectamos el set completo (propios + global).
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
        const isGlobalAllowed = ['document_types', 'translations', 'file_blobs', 'spaces'].includes(this.collection.collectionName);
        const incomingTenantId = (doc as any).tenantId;

        // 🛡️ Phase 125.2: Allow abd_global for global-compatible collections if specified
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

        // Forzar actualización de updatedAt
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
        // Warning: this doesn't automatically apply tenantId to inserts in bulkWrite
        // unless they are explicitly part of the operations. 
        // For i18n sync, we handle this in the service.
        return this.collection.bulkWrite(operations, options);
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

export type DatabaseType = 'MAIN' | 'LOGS' | 'AUTH';

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
            const { auth } = await import('./auth');
            session = await auth();
        } catch (e) {
            console.warn('[db-tenant] Failed to retrieve session from auth()', e);
        }
    }

    // 🛡️ REGLA DE ORO #9: Hardening Multi-tenant
    const hasValidSession = session && session.user && session.user.tenantId;
    const isSingleTenantMode = !!process.env.SINGLE_TENANT_ID;

    // Redirección Automática para Identidades y Logs (Phase 87)
    let effectiveDbType = dbType;
    if (collectionName === 'users' || collectionName === 'v2_users' || collectionName === 'tenants' || collectionName === 'permission_groups') {
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
    } else if (collectionName === 'knowledge_assets' || collectionName === 'user_documents') {
        // Redirigir a MAIN explícitamente si queremos asegurar que no se pierdan, 
        // pero estas suelen estar en MAIN. La regla es que 'users' y 'permission_groups' VAN A AUTH.
        effectiveDbType = 'MAIN';
    } else if (collectionName === 'translations') {
        // i18n Governance Phase: Allow platform_master access if no session
        effectiveDbType = 'MAIN';
    }

    if (hasValidSession || isSingleTenantMode || collectionName === 'translations') {
        // Safe to proceed
        let db;
        if (effectiveDbType === 'LOGS') {
            db = await connectLogsDB();
        } else if (effectiveDbType === 'AUTH') {
            db = await connectAuthDB();
        } else {
            db = await connectDB();
        }

        const rawCollection = db.collection<T>(collectionName);

        // Ensure that if there's no session, we use platform_master context
        const effectiveSession = session || { user: { tenantId: 'platform_master', role: 'GUEST' } };

        return new SecureCollection<T>(rawCollection, effectiveSession, options);
    }

    // Attempted access without valid session
    const errorMsg = `Aislamiento de Tenant fallido para '${collectionName}': Contexto no encontrado (User: ${!!session?.user}, SINGLE_TENANT_ID: ${process.env.SINGLE_TENANT_ID || 'missing'})`;
    console.error(`[SECURITY ALERT] ${errorMsg}`);
    throw new AppError('UNAUTHORIZED', 401, errorMsg);
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

export async function getReportsCollection(session?: any) {
    return await getTenantCollection('reports', session);
}

export async function getReportSchedulesCollection(session?: any) {
    return await getTenantCollection<ReportSchedule>('report_schedules', session);
}

