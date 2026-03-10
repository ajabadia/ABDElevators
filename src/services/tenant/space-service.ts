import { ObjectId, Filter } from 'mongodb';
import { getTenantCollection, TenantSession } from '@/lib/db-tenant';
import { Space, SpaceSchema } from '@/lib/schemas/spaces';
import { IndustryType } from '@/lib/schemas/core';
import { LimitsService } from '@/services/security/limits-service';
import { AppError, ValidationError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { EntityIdSchema, TenantIdSchema } from '@/lib/schemas/common';

/**
 * 🌌 SpaceService: Gestión de Espacios Universales (Phase 125.2)
 */
export class SpaceService {
    private static readonly COLLECTION = 'spaces';

    /**
     * Crea un nuevo espacio validando cuotas y calculando jerarquía.
     */
    static async createSpace(rawTenantId: string, rawUserId: string, data: Partial<Space>, session?: TenantSession) {
        const tenantId = TenantIdSchema.parse(rawTenantId);
        const userId = EntityIdSchema.parse(rawUserId);
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
                ownerUserId: userId // Refactored from createdBy
            });

            if (userSpaces >= limits.spaces_per_user) {
                throw new AppError('LIMIT_EXCEEDED', 403, `Has alcanzado el límite de tus espacios personales (${limits.spaces_per_user}) para tu plan.`);
            }
        }

        // 2. Calcular Jerarquía (Materialized Path)
        let materializedPath = `/${data.slug}`;
        let parentSpaceId: any = undefined;

        if (data.parentSpaceId) {
            parentSpaceId = EntityIdSchema.parse(data.parentSpaceId);
            const parent = await collection.findOne({ _id: parentSpaceId } as any);
            if (!parent) throw new ValidationError('Espacio padre no encontrado');
            materializedPath = `${parent.materializedPath}/${data.slug}`;
        }

        // 3. Preparar Documento
        const newSpace = SpaceSchema.parse({
            ...data,
            tenantId: data.type === 'GLOBAL' || data.type === 'INDUSTRY' ? 'abd_global' : (data.tenantId || tenantId),
            ownerUserId: data.type === 'PERSONAL' ? userId : data.ownerUserId,
            parentSpaceId: parentSpaceId,
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
        rawTenantId: string,
        rawUserId: string,
        filters: {
            industry?: string;
            isRoot?: boolean;
            parentSpaceId?: string;
            search?: string;
        } = {},
        session?: TenantSession
    ) {
        const tenantId = TenantIdSchema.parse(rawTenantId);
        const userId = EntityIdSchema.parse(rawUserId);
        const collection = await getTenantCollection<Space>(this.COLLECTION, session);
        const limits = await LimitsService.getEffectiveLimits(tenantId);
        const isFreePlan = limits.tier === 'FREE';

        // 🛡️ Filtro de seguridad base (Basado en Reglas de Negocio + Guardian Parity)
        const accessibilityQuery: Filter<Space> = {
            $or: [
                // 1. Espacios Personales
                { type: 'PERSONAL', ownerUserId: userId },

                // 2. Colaboraciones directas
                { "collaborators.userId": userId },

                // 3. Espacios de Tenant (Públicos o Propios)
                {
                    tenantId,
                    type: 'TENANT',
                    $or: [
                        { visibility: 'PUBLIC' },
                        { visibility: 'PRIVATE', ownerUserId: userId }
                    ]
                }
            ]
        };

        // 4. Restricciones de Plan para INDUSTRY y GLOBAL
        if (!isFreePlan) {
            (accessibilityQuery.$or as any[]).push({ type: 'INDUSTRY', industry: filters.industry as IndustryType });
            (accessibilityQuery.$or as any[]).push({ type: 'GLOBAL' });
        }

        // 2. Aplicar filtros jerárquicos y búsqueda
        const extraFilters: Filter<Space> = {};
        if (filters.isRoot) {
            extraFilters.parentSpaceId = { $exists: false } as any;
        } else if (filters.parentSpaceId) {
            extraFilters.parentSpaceId = EntityIdSchema.parse(filters.parentSpaceId);
        }

        if (filters.search) {
            extraFilters.name = { $regex: filters.search, $options: 'i' };
        }

        return await collection.find({
            $and: [accessibilityQuery, extraFilters]
        } as Filter<Space>);
    }

    /**
     * Mueve un espacio (actualiza recursivamente el materializedPath).
     */
    static async moveSpace(rawSpaceId: string, rawNewParentId: string | null, rawTenantId: string, session?: TenantSession) {
        const spaceId = EntityIdSchema.parse(rawSpaceId);
        const tenantId = TenantIdSchema.parse(rawTenantId);
        const collection = await getTenantCollection<Space>(this.COLLECTION, session);
        const space = await collection.findOne({ _id: spaceId } as any);
        if (!space) throw new ValidationError('Espacio no encontrado');

        let newPath = `/${space.slug}`;
        let newParentId: any = undefined;

        if (rawNewParentId) {
            newParentId = EntityIdSchema.parse(rawNewParentId);
            const newParent = await collection.findOne({ _id: newParentId } as any);
            if (!newParent) throw new ValidationError('Nuevo espacio padre no encontrado');
            newPath = `${newParent.materializedPath}/${space.slug}`;
        }

        const oldPath = space.materializedPath;

        // 1. Actualizar el espacio actual
        await collection.updateOne(
            { _id: spaceId } as any,
            { $set: { parentSpaceId: newParentId || undefined, materializedPath: newPath, updatedAt: new Date() } }
        );

        // 2. Actualizar hijos recursivamente (Fase 125.2)
        if (oldPath) {
            const children = await collection.find({ materializedPath: { $regex: `^${oldPath}/` } } as Filter<Space>);
            for (const child of children) {
                const childSubPath = child.materializedPath?.replace(oldPath, '');
                await collection.updateOne(
                    { _id: child._id } as any,
                    { $set: { materializedPath: `${newPath}${childSubPath}` } }
                );
            }
        }
    }
}
