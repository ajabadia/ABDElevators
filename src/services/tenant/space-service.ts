import { ObjectId, Filter } from 'mongodb';
import { getTenantCollection, TenantSession } from '@/lib/db-tenant';
import { Space, SpaceSchema } from '@/lib/schemas/spaces';
import { IndustryType } from '@/lib/schemas/core';
import { LimitsService } from '@/services/security/limits-service';
import { AppError, ValidationError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { EntityId, EntityIdSchema, TenantId, TenantIdSchema } from '@/lib/schemas/common';
import { knowledgeAssetRepository } from '@/lib/repositories/KnowledgeAssetRepository';
import { documentChunkRepository } from '@/lib/repositories/DocumentChunkRepository';
import { assetSpaceLinkRepository } from '@/lib/repositories/AssetSpaceLinkRepository';

/**
 * 🌌 SpaceService: Gestión de Espacios Universales (Phase 125.2)
 */
export class SpaceService {
    private static readonly COLLECTION = 'spaces';

    /**
     * Crea un nuevo espacio validando cuotas y calculando jerarquía.
     */
    static async createSpace(tenantId: TenantId, userId: EntityId, data: Partial<Space>, session?: TenantSession) {
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
        let parentSpaceId: Space['parentSpaceId'] = undefined;

        if (data.parentSpaceId) {
            parentSpaceId = EntityIdSchema.parse(data.parentSpaceId);
            const parent = await collection.findOne({ _id: parentSpaceId } as unknown as Filter<Space>);
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
        tenantId: TenantId,
        userId: EntityId,
        filters: {
            industry?: string;
            isRoot?: boolean;
            parentSpaceId?: EntityId;
            search?: string;
        } = {},
        session?: TenantSession
    ) {
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
            const orArray = accessibilityQuery.$or as Filter<Space>[];
            orArray.push({ type: 'INDUSTRY', industry: filters.industry as IndustryType });
            orArray.push({ type: 'GLOBAL' });
        }

        // 2. Aplicar filtros jerárquicos y búsqueda
        const extraFilters: Filter<Space> = {};
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
        });
    }

    /**
     * Mueve un espacio (actualiza recursivamente el materializedPath).
     */
    static async moveSpace(spaceId: EntityId, newParentId: EntityId | null, tenantId: TenantId, session?: TenantSession) {
        const collection = await getTenantCollection<Space>(this.COLLECTION, session);
        const space = await collection.findOne({ _id: spaceId } as unknown as Filter<Space>);
        if (!space) throw new ValidationError('Espacio no encontrado');

        let newPath = `/${space.slug}`;
        let actualParentId: Space['parentSpaceId'] = undefined;

        if (newParentId) {
            actualParentId = newParentId;
            const newParent = await collection.findOne({ _id: actualParentId } as unknown as Filter<Space>);
            if (!newParent) throw new ValidationError('Nuevo espacio padre no encontrado');
            newPath = `${newParent.materializedPath}/${space.slug}`;
        }

        const oldPath = space.materializedPath;

        // 1. Actualizar el espacio actual
        await collection.updateOne(
            { _id: spaceId } as unknown as Filter<Space>,
            { $set: { parentSpaceId: actualParentId || undefined, materializedPath: newPath, updatedAt: new Date() } }
        );

        // 2. Actualizar hijos recursivamente (Fase 125.2)
        if (oldPath) {
            const children = await collection.find({ materializedPath: { $regex: `^${oldPath}/` } });
            for (const child of children) {
                const childSubPath = child.materializedPath?.replace(oldPath, '');
                await collection.updateOne(
                    { _id: child._id } as unknown as Filter<Space>,
                    { $set: { materializedPath: `${newPath}${childSubPath}` } }
                );
            }
            // 3. PROPAGACIÓN RELACIONAL (Phase 344)
            // Sincronizar KnowledgeAssets, Chunks y AssetSpaceLinks
            const updateCount = await Promise.all([
                knowledgeAssetRepository.updatePaths(oldPath, newPath, session),
                documentChunkRepository.updatePaths(oldPath, newPath, session),
                assetSpaceLinkRepository.updatePaths(oldPath, newPath, session)
            ]);

            await logEvento({
                level: 'INFO',
                source: 'SPACE_SERVICE',
                action: 'MOVE_SPACE_SYNC',
                message: `Sincronizados paths de activos y chunks tras mover espacio ${spaceId}`,
                tenantId,
                details: { oldPath, newPath, assetsUpdated: updateCount[0] }
            });
        }
    }

    /**
     * Obtiene un espacio por su ruta materializada (SpacePath).
     */
    static async getSpaceByPath(path: string, tenantId: TenantId, session?: TenantSession): Promise<Space | null> {
        const collection = await getTenantCollection<Space>('spaces', session);
        return await collection.findOne({
            materializedPath: path,
            tenantId,
            isActive: true
        } as unknown as Filter<Space>);
    }

    /**
     * Vincula un activo a un espacio (Multi-Space Support Phase 344)
     */
    static async linkAssetToSpace(assetId: EntityId, spaceId: EntityId, tenantId: TenantId, session?: TenantSession) {

        // 1. Obtener path del espacio
        const collection = await getTenantCollection<Space>(this.COLLECTION, session);
        const space = await collection.findOne({ _id: spaceId } as unknown as Filter<Space>);
        if (!space) throw new ValidationError('Espacio no encontrado');

        // 2. Crear Link
        return await assetSpaceLinkRepository.create({
            assetId,
            spaceId,
            spacePath: space.materializedPath || "",
            tenantId,
            isPrimary: false,
            createdAt: new Date(),
            isDeleted: false // Phase 344
        }, session);
    }

    /**
     * Obtiene todos los vínculos de un activo con nombres de espacios.
     */
    static async getAssetLinks(assetId: EntityId, session?: TenantSession) {
        const links = await assetSpaceLinkRepository.findByAssetId(assetId, session);

        // Enriquecer con nombres de espacios
        const spaceCollection = await getTenantCollection<Space>(this.COLLECTION, session);

        const enrichedLinks = await Promise.all(links.map(async (link) => {
            const space = await spaceCollection.findOne({ _id: link.spaceId } as any);
            return {
                ...link,
                spaceName: space?.name || 'Espacio Desconocido'
            };
        }));

        return enrichedLinks;
    }

    /**
     * Desvincula un activo de un espacio
     */
    static async unlinkAssetFromSpace(assetId: EntityId, spaceId: EntityId, session?: TenantSession) {

        const collection = await getTenantCollection('asset_space_links', session);
        return await collection.deleteOne({ assetId, spaceId });
    }

    /**
     * Mueve un activo de un espacio a otro (Cambiando el spaceId primario)
     */
    static async moveAsset(assetId: EntityId, spaceId: EntityId, tenantId: TenantId, session?: TenantSession) {

        // 1. Obtener config del nuevo espacio
        const collection = await getTenantCollection<Space>(this.COLLECTION, session);
        const space = await collection.findOne({ _id: spaceId } as unknown as Filter<Space>);
        if (!space) throw new ValidationError('Nuevo espacio no encontrado');

        const newPath = space.materializedPath || "";

        // 2. Actualizar Activo
        await knowledgeAssetRepository.update(assetId, {
            spaceId: spaceId,
            spacePath: newPath
        }, session);

        // 3. Actualizar Chunks
        await documentChunkRepository.updatePathByAsset(assetId, newPath, session);

        // 4. Actualizar Links (si existe link primario, actualizarlo)
        const linksCollection = await getTenantCollection('asset_space_links', session);
        await linksCollection.updateOne(
            { assetId, isPrimary: true },
            { $set: { spaceId, spacePath: newPath } }
        );

        await logEvento({
            level: 'INFO',
            source: 'SPACE_SERVICE',
            action: 'MOVE_ASSET',
            message: `Activo ${assetId} movido a espacio ${spaceId}`,
            tenantId,
            details: { assetId, newSpaceId: spaceId, newPath }
        });
    }

    /**
     * Establece un espacio como primario para un activo.
     */
    static async setPrimarySpace(assetId: EntityId, spaceId: EntityId, tenantId: TenantId, session?: TenantSession) {

        const linksCollection = await getTenantCollection('asset_space_links', session);

        // 1. Quitar flag primary de todos los links del activo
        await linksCollection.updateMany(
            { assetId },
            { $set: { isPrimary: false } }
        );

        // 2. Establecer el nuevo primario
        const result = await linksCollection.updateOne(
            { assetId, spaceId },
            { $set: { isPrimary: true } }
        );

        if (result.matchedCount === 0) {
            throw new ValidationError('El vínculo no existe');
        }

        // 3. Sync con el KnowledgeAsset (Primary Source of Truth)
        const link = await linksCollection.findOne({ assetId, spaceId });
        if (link) {
            await knowledgeAssetRepository.update(assetId, {
                spaceId: spaceId,
                spacePath: link.spacePath
            }, session);
        }

        await logEvento({
            level: 'INFO',
            source: 'SPACE_SERVICE',
            action: 'SET_PRIMARY_SPACE',
            message: `Espacio ${spaceId} marcado como primario para activo ${assetId}`,
            tenantId,
            details: { assetId, spaceId }
        });
    }
}
