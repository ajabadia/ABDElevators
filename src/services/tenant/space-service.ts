import { ObjectId, type Filter } from 'mongodb';
import { type TenantSession } from '@/lib/db-tenant';
import { type Space, SpaceSchema } from '@/lib/schemas/spaces';
import { IndustryType } from '@/lib/schemas/core';
import { LimitsService } from '@/services/security/limits-service';
import { AppError, ValidationError } from '@/lib/errors';
import { EntityId, EntityIdSchema, TenantId, TenantIdSchema } from '@/lib/schemas/common';
import { knowledgeAssetRepository } from '@/lib/repositories/KnowledgeAssetRepository';
import { documentChunkRepository } from '@/lib/repositories/DocumentChunkRepository';
import { assetSpaceLinkRepository } from '@/lib/repositories/AssetSpaceLinkRepository';
import { spaceRepository } from '@/lib/repositories/SpaceRepository';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { getSystemSession } from '@/lib/sessions/system-session';

/**
 * 🌌 SpaceService: Universal Spaces Management (Phase 125.2)
 */
export class SpaceService {
    /**
     * Creates a new space validating quotas and calculating hierarchy.
     */
    static async createSpace(tenantId: TenantId, userId: EntityId, data: Partial<Space>, session?: TenantSession, correlationId?: string) {
        return await withCorrelation(
            { level: 'INFO', source: 'SPACE_SERVICE', action: 'CREATE_SPACE', tenantId, correlationId },
            async ({ log, correlationId }) => {
                // 1. Validate Quotas (only for Tenant/Personal spaces)
                if (data.type === 'TENANT' || data.type === 'PERSONAL' || data.type === 'INDUSTRY' || data.type === 'GLOBAL') {
                    const limits = await LimitsService.getEffectiveLimits(tenantId);

                    // A. Limit per Tenant (Total)
                    const totalSpaces = await spaceRepository.countDocuments({}, session);
                    if (totalSpaces >= limits.spaces_per_tenant) {
                        throw new AppError('LIMIT_EXCEEDED', 403, `The tenant has reached the total space limit (${limits.spaces_per_tenant}) for their plan.`);
                    }

                    // B. Limit per User (Personal)
                    const userSpaces = await spaceRepository.countDocuments({
                        ownerUserId: userId
                    }, session);

                    if (userSpaces >= limits.spaces_per_user) {
                        throw new AppError('LIMIT_EXCEEDED', 403, `You have reached the personal space limit (${limits.spaces_per_user}) for your plan.`);
                    }
                }

                // 2. Calculate Hierarchy (Materialized Path)
                let materializedPath = `/${data.slug}`;
                let parentSpaceId: Space['parentSpaceId'] = undefined;

                if (data.parentSpaceId) {
                    parentSpaceId = EntityIdSchema.parse(data.parentSpaceId);
                    const parent = await spaceRepository.findById(parentSpaceId as string, session);
                    if (!parent) throw new ValidationError('Parent space not found');
                    materializedPath = `${parent.materializedPath}/${data.slug}`;
                }

                // 3. Prepare Document
                const newSpace = SpaceSchema.parse({
                    ...data,
                    tenantId: data.type === 'GLOBAL' || data.type === 'INDUSTRY' ? 'abd_global' : (data.tenantId || tenantId),
                    ownerUserId: data.type === 'PERSONAL' ? userId : data.ownerUserId,
                    parentSpaceId: parentSpaceId,
                    materializedPath,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                const spaceId = await spaceRepository.create(newSpace, session);

                await log({
                    message: `Space '${data.name}' (${data.type}) created by ${userId}`,
                    details: { spaceId, type: data.type, path: materializedPath }
                });

                return spaceId;
            }
        );
    }

    /**
     * Gets accessible spaces for a user with hierarchy support.
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
        const limits = await LimitsService.getEffectiveLimits(tenantId);
        const isFreePlan = limits.tier === 'FREE';

        // 🛡️ Base security filter (Based on Business Rules + Guardian Parity)
        const accessibilityQuery: Filter<Space> = {
            $or: [
                // 1. Personal Spaces
                { type: 'PERSONAL', ownerUserId: userId },

                // 2. Direct collaborations
                { "collaborators.userId": userId },

                // 3. Tenant Spaces (Public or Own)
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

        // 4. Plan restrictions for INDUSTRY and GLOBAL
        if (!isFreePlan) {
            const orArray = accessibilityQuery.$or as Filter<Space>[];
            orArray.push({ type: 'INDUSTRY', industry: filters.industry as IndustryType });
            orArray.push({ type: 'GLOBAL' });
        }

        // 2. Apply hierarchy filters and search
        const extraFilters: Filter<Space> = {};
        if (filters.isRoot) {
            extraFilters.parentSpaceId = { $exists: false };
        } else if (filters.parentSpaceId) {
            extraFilters.parentSpaceId = filters.parentSpaceId;
        }

        if (filters.search) {
            extraFilters.name = { $regex: filters.search, $options: 'i' };
        }

        return await spaceRepository.find({
            $and: [accessibilityQuery, extraFilters]
        }, {}, session);
    }

    /**
     * Moves a space (recursively updates the materializedPath).
     */
    static async moveSpace(spaceId: EntityId, newParentId: EntityId | null, tenantId: TenantId, session?: TenantSession, correlationId?: string) {
        return await withCorrelation(
            { level: 'INFO', source: 'SPACE_SERVICE', action: 'MOVE_SPACE', tenantId, correlationId },
            async ({ log, correlationId }) => {
                const space = await spaceRepository.findById(spaceId as string, session);
                if (!space) throw new ValidationError('Space not found');

                let newPath = `/${space.slug}`;
                let actualParentId: Space['parentSpaceId'] = undefined;

                if (newParentId) {
                    actualParentId = newParentId;
                    const newParent = await spaceRepository.findById(actualParentId as string, session);
                    if (!newParent) throw new ValidationError('New parent space not found');
                    newPath = `${newParent.materializedPath}/${space.slug}`;
                }

                const oldPath = space.materializedPath;

                // 1. Update current space
                await spaceRepository.update(spaceId as string, { 
                    $set: { parentSpaceId: actualParentId || undefined, materializedPath: newPath, updatedAt: new Date() } 
                }, session);

                // 2. Recursively update children (Phase 125.2)
                if (oldPath) {
                    const children = await spaceRepository.find({ materializedPath: { $regex: `^${oldPath}/` } }, {}, session);
                    for (const child of children) {
                        const childSubPath = child.materializedPath?.replace(oldPath, '');
                        await spaceRepository.update(child._id?.toString() as string, { 
                            $set: { materializedPath: `${newPath}${childSubPath}` } 
                        }, session);
                    }
                    // 3. RELATIONAL PROPAGATION (Phase 344)
                    // Synchronize KnowledgeAssets, Chunks and AssetSpaceLinks
                    const updateCount = await Promise.all([
                        knowledgeAssetRepository.updatePaths(oldPath, newPath, session),
                        documentChunkRepository.updatePaths(oldPath, newPath, session),
                        assetSpaceLinkRepository.updatePaths(oldPath, newPath, session)
                    ]);

                    await log({
                        action: 'MOVE_SPACE_SYNC',
                        message: `Synchronized asset and chunk paths after moving space ${spaceId}`,
                        details: { oldPath, newPath, assetsUpdated: updateCount[0] }
                    });
                }
            }
        );
    }

    /**
     * Gets a space by its materialized path (SpacePath).
     */
    static async getSpaceByPath(path: string, tenantId: TenantId, session?: TenantSession): Promise<Space | null> {
        return await spaceRepository.findByPath(path, tenantId as string, session);
    }

    /**
     * Links an asset to a space (Multi-Space Support Phase 344)
     */
    static async linkAssetToSpace(assetId: EntityId, spaceId: EntityId, tenantId: TenantId, session?: TenantSession) {

        // 1. Get space path
        const space = await spaceRepository.findById(spaceId as string, session);
        if (!space) throw new ValidationError('Space not found');

        // 2. Create Link
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
     * Gets all links of an asset with space names.
     */
    static async getAssetLinks(assetId: EntityId, session?: TenantSession) {
        const links = await assetSpaceLinkRepository.findByAssetId(assetId, session);

        // Enrich with space names
        const enrichedLinks = await Promise.all(links.map(async (link) => {
            const space = await spaceRepository.findById(link.spaceId as string, session);
            return {
                ...link,
                spaceName: space?.name || 'Unknown Space'
            };
        }));

        return enrichedLinks;
    }

    /**
     * Unlinks an asset from a space.
     */
    static async unlinkAssetFromSpace(assetId: EntityId, spaceId: EntityId, session?: TenantSession) {
        return await assetSpaceLinkRepository.deleteByAssetAndSpace(assetId, spaceId, session);
    }

    /**
     * Moves an asset from one space to another (Changing primary spaceId).
     */
    static async moveAsset(assetId: EntityId, spaceId: EntityId, tenantId: TenantId, session?: TenantSession, correlationId?: string) {
        return await withCorrelation(
            { level: 'INFO', source: 'SPACE_SERVICE', action: 'MOVE_ASSET', tenantId, correlationId },
            async ({ log, correlationId }) => {
                // 1. Get new space config
                const space = await spaceRepository.findById(spaceId as string, session);
                if (!space) throw new ValidationError('New space not found');

                const newPath = space.materializedPath || "";

                // 2. Update Asset
                await knowledgeAssetRepository.update(assetId, {
                    spaceId: spaceId,
                    spacePath: newPath
                }, session);

                // 3. Update Chunks
                await documentChunkRepository.updatePathByAsset(assetId, newPath, session);

                // 4. Update Links (if primary link exists, update it)
                await assetSpaceLinkRepository.updatePrimaryPath(assetId, spaceId, newPath, session);

                await log({
                    message: `Asset ${assetId} moved to space ${spaceId}`,
                    details: { assetId, newSpaceId: spaceId, newPath }
                });
            }
        );
    }

    /**
     * Sets a space as primary for an asset.
     */
    static async setPrimarySpace(assetId: EntityId, spaceId: EntityId, tenantId: TenantId, session?: TenantSession, correlationId?: string) {
        return await withCorrelation(
            { level: 'INFO', source: 'SPACE_SERVICE', action: 'SET_PRIMARY_SPACE', tenantId, correlationId },
            async ({ log, correlationId }) => {
                // 1. mark as primary in link repository
                await assetSpaceLinkRepository.setPrimaryLink(assetId, spaceId, session);

                // 2. Sync with KnowledgeAsset (Primary Source of Truth)
                const link = await assetSpaceLinkRepository.findOne({ assetId, spaceId } as any, session);
                if (link) {
                    await knowledgeAssetRepository.update(assetId, {
                        spaceId: spaceId,
                        spacePath: link.spacePath
                    }, session);
                }

                await log({
                    message: `Space ${spaceId} marked as primary for asset ${assetId}`,
                    details: { assetId, spaceId }
                });
            }
        );
    }
}
