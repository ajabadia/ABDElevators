import { ObjectId } from 'mongodb';
import { getTenantCollection } from '@/lib/db-tenant';
import { Space, SpaceSchema } from '@/lib/schemas/spaces';
import { LimitsService } from '@/lib/limits-service';
import { AppError, ValidationError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';

/**
 * 🌌 SpaceService: Gestión de Espacios Universales (Phase 125.2)
 */
export class SpaceService {
    private static readonly COLLECTION = 'spaces';

    /**
     * Crea un nuevo espacio validando cuotas y calculando jerarquía.
     */
    static async createSpace(tenantId: string, userId: string, data: Partial<Space>, session?: any) {
        const correlationId = crypto.randomUUID();
        const collection = await getTenantCollection<Space>(this.COLLECTION, session);

        // 1. Validar Cuotas (solo para espacios de Tenant/Personal)
        if (data.type === 'TENANT' || data.type === 'PERSONAL' || data.type === 'INDUSTRY' || data.type === 'GLOBAL') {
            const limits = await LimitsService.getEffectiveLimits(tenantId);

            // A. Límite por Tenant (Total)
            const totalSpaces = await collection.countDocuments({}); // countDocuments in SecureCollection already filters by tenant
            if (totalSpaces >= limits.spaces_per_tenant) {
                throw new AppError('LIMIT_EXCEEDED', 403, `El tenant ha alcanzado el límite total de espacios (${limits.spaces_per_tenant}) para su plan.`);
            }

            // B. Límite por Usuario (Personal)
            const userSpaces = await collection.countDocuments({
                createdBy: userId
            });

            if (userSpaces >= limits.spaces_per_user) {
                throw new AppError('LIMIT_EXCEEDED', 403, `Has alcanzado el límite de tus espacios personales (${limits.spaces_per_user}) para tu plan.`);
            }
        }

        // 2. Calcular Jerarquía (Materialized Path)
        let materializedPath = `/${data.slug}`;
        if (data.parentSpaceId) {
            const parent = await collection.findOne({ _id: new ObjectId(data.parentSpaceId) });
            if (!parent) throw new ValidationError('Espacio padre no encontrado');
            materializedPath = `${parent.materializedPath}/${data.slug}`;
        }

        // 3. Preparar Documento
        const newSpace = SpaceSchema.parse({
            ...data,
            tenantId: data.type === 'GLOBAL' || data.type === 'INDUSTRY' ? 'abd_global' : (data.tenantId || tenantId),
            ownerUserId: data.type === 'PERSONAL' ? userId : data.ownerUserId,
            materializedPath,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const result = await collection.insertOne(newSpace);

        await logEvento({
            level: 'INFO',
            source: 'SPACE_SERVICE',
            action: 'CREATE_SPACE',
            message: `Espacio '${data.name}' (${data.type}) creado por ${userId}`,
            tenantId,
            correlationId,
            details: { spaceId: result.insertedId, type: data.type, path: materializedPath }
        });

        return result.insertedId;
    }

    /**
     * Obtiene los espacios accesibles para un usuario con soporte para jerarquía.
     */
    static async getAccessibleSpaces(
        tenantId: string,
        userId: string,
        filters: {
            industry?: string;
            isRoot?: boolean;
            parentSpaceId?: string;
            search?: string;
        } = {},
        session?: any
    ) {
        const collection = await getTenantCollection<Space>(this.COLLECTION, session);
        const limits = await LimitsService.getEffectiveLimits(tenantId);
        const isFreePlan = limits.tier === 'FREE';

        // 🛡️ Filtro de seguridad base (Basado en Reglas de Negocio + Guardian Parity)
        const accessibilityQuery: any = {
            $or: [
                // 1. Espacios Personales
                { type: 'PERSONAL', createdBy: userId },

                // 2. Colaboraciones directas
                { "collaborators.userId": userId },

                // 3. Espacios de Tenant (Públicos o Propios)
                {
                    tenantId,
                    type: 'TENANT',
                    $or: [
                        { visibility: 'PUBLIC' },
                        { visibility: 'PRIVATE', createdBy: userId }
                    ]
                }
            ]
        };

        // 4. Restricciones de Plan para INDUSTRY y GLOBAL
        if (!isFreePlan) {
            accessibilityQuery.$or.push({ type: 'INDUSTRY', industry: filters.industry as any });
            accessibilityQuery.$or.push({ type: 'GLOBAL' });
        }

        // 2. Aplicar filtros jerárquicos y búsqueda
        const extraFilters: any = {};
        if (filters.isRoot) {
            extraFilters.parentSpaceId = { $exists: false };
        } else if (filters.parentSpaceId) {
            extraFilters.parentSpaceId = filters.parentSpaceId;
        }

        if (filters.search) {
            extraFilters.name = { $regex: filters.search, $options: 'i' };
        }

        return await collection.find({
            $and: [accessibilityQuery, extraFilters]
        } as any);
    }

    /**
     * Mueve un espacio (actualiza recursivamente el materializedPath).
     */
    static async moveSpace(spaceId: string, newParentId: string | null, tenantId: string, session?: any) {
        const collection = await getTenantCollection<Space>(this.COLLECTION, session);
        const space = await collection.findOne({ _id: new ObjectId(spaceId) });
        if (!space) throw new ValidationError('Espacio no encontrado');

        let newPath = `/${space.slug}`;
        if (newParentId) {
            const newParent = await collection.findOne({ _id: new ObjectId(newParentId) });
            if (!newParent) throw new ValidationError('Nuevo espacio padre no encontrado');
            newPath = `${newParent.materializedPath}/${space.slug}`;
        }

        const oldPath = space.materializedPath;

        // 1. Actualizar el espacio actual
        await collection.updateOne(
            { _id: new ObjectId(spaceId) },
            { $set: { parentSpaceId: newParentId || undefined, materializedPath: newPath, updatedAt: new Date() } }
        );

        // 2. Actualizar hijos recursivamente (Fase 125.2)
        if (oldPath) {
            const children = await collection.find({ materializedPath: { $regex: `^${oldPath}/` } } as any);
            for (const child of children) {
                const childSubPath = child.materializedPath?.replace(oldPath, '');
                await collection.updateOne(
                    { _id: child._id },
                    { $set: { materializedPath: `${newPath}${childSubPath}` } }
                );
            }
        }
    }
}
