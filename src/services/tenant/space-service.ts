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
 * 🌌 SpaceService: Universal Spaces Management (Phase 125.2)
 */
export class SpaceService {
    private static readonly COLLECTION = 'spaces';

    /**
     * Creates a new space validating quotas and calculating hierarchy.
     */
    static async createSpace(tenantId: TenantId, userId: EntityId, data: Partial<Space>, session?: TenantSession) {
        const correlationId = crypto.randomUUID();
        const collection = await getTenantCollection<Space>(this.COLLECTION, session);

        // 1. Validate Quotas (only for Tenant/Personal spaces)
        if (data.type === 'TENANT' || data.type === 'PERSONAL' || data.type === 'INDUSTRY' || data.type === 'GLOBAL') {
            const limits = await LimitsService.getEffectiveLimits(tenantId);

            // A. Limit per Tenant (Total)
            const totalSpaces = await collection.countDocuments({}); // countDocuments in SecureCollection already filters by tenant
            if (totalSpaces >= limits.spaces_per_tenant) {
                throw new AppError('LIMIT_EXCEEDED', 403, `The tenant has reached the total space limit (${limits.spaces_per_tenant}) for their plan.`);
            }

            // B. Limit per User (Personal)
            const userSpaces = await collection.countDocuments({
                ownerUserId: userId // Refactored from createdBy
            });

            if (userSpaces >= limits.spaces_per_user) {
                throw new AppError('LIMIT_EXCEEDED', 403, `You have reached the personal space limit (${limits.spaces_per_user}) for your plan.`);
            }
        }

        // 2. Calculate Hierarchy (Materialized Path)
        let materializedPath = `/${data.slug}`;
        let parentSpaceId: Space['parentSpaceId'] = undefined;

        if (data.parentSpaceId) {
            parentSpaceId = EntityIdSchema.parse(data.parentSpaceId);
            const parent = await collection.findOne({ _id: parentSpaceId } as unknown as Filter<Space>);
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

        const result = await collection.insertOne(newSpace);

        await logEvento({
            level: 'INFO',
            source: 'SPACE_SERVICE',
            action: 'CREATE_SPACE',
            message: `Space '${data.name}' (${data.type}) created by ${userId}`,
            tenantId,
            correlationId,
            details: { spaceId: result.insertedId, type: data.type, path: materializedPath }
        });

        return result.insertedId;
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
        const collection = await getTenantCollection<Space>(this.COLLECTION, session);
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

        return await collection.find({
            $and: [accessibilityQuery, extraFilters]
        });
    }

    /**
     * Moves a space (recursively updates the materializedPath).
     */
    static async moveSpace(spaceId: EntityId, newParentId: EntityId | null, tenantId: TenantId, session?: TenantSession) {
        const collection = await getTenantCollection<Space>(this.COLLECTION, session);
        const space = await collection.findOne({ _id: spaceId } as unknown as Filter<Space>);
        if (!space) throw new ValidationError('Space not found');

        let newPath = `/${space.slug}`;
        let actualParentId: Space['parentSpaceId'] = undefined;

        if (newParentId) {
            actualParentId = newParentId;
            const newParent = await collection.findOne({ _id: actualParentId } as unknown as Filter<Space>);
            if (!newParent) throw new ValidationError('New parent space not found');
            newPath = `${newParent.materializedPath}/${space.slug}`;
        }

        const oldPath = space.materializedPath;

        // 1. Update current space
        await collection.updateOne(
            { _id: spaceId } as unknown as Filter<Space>,
            { $set: { parentSpaceId: actualParentId || undefined, materializedPath: newPath, updatedAt: new Date() } }
        );

        // 2. Recursively update children (Phase 125.2)
        if (oldPath) {
            const children = await collection.find({ materializedPath: { $regex: `^${oldPath}/` } });
            for (const child of children) {
                const childSubPath = child.materializedPath?.replace(oldPath, '');
                await collection.updateOne(
                    { _id: child._id } as unknown as Filter<Space>,
                    { $set: { materializedPath: `${newPath}${childSubPath}` } }
                );
            }
            // 3. RELATIONAL PROPAGATION (Phase 344)
            // Synchronize KnowledgeAssets, Chunks and AssetSpaceLinks
            const updateCount = await Promise.all([
                knowledgeAssetRepository.updatePaths(oldPath, newPath, session),
                documentChunkRepository.updatePaths(oldPath, newPath, session),
                assetSpaceLinkRepository.updatePaths(oldPath, newPath, session)
            ]);

            await logEvento({
                level: 'INFO',
                source: 'SPACE_SERVICE',
                action: 'MOVE_SPACE_SYNC',
                message: `Synchronized asset and chunk paths after moving space ${spaceId}`,
                tenantId,
                details: { oldPath, newPath, assetsUpdated: updateCount[0] }
            });
        }
    }

    /**
     * Gets a space by its materialized path (SpacePath).
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
     * Links an asset to a space (Multi-Space Support Phase 344)
     */
    static async linkAssetToSpace(assetId: EntityId, spaceId: EntityId, tenantId: TenantId, session?: TenantSession) {

        // 1. Get space path
        const collection = await getTenantCollection<Space>(this.COLLECTION, session);
        const space = await collection.findOne({ _id: spaceId } as unknown as Filter<Space>);
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
        const spaceCollection = await getTenantCollection<Space>(this.COLLECTION, session);

        const enrichedLinks = await Promise.all(links.map(async (link) => {
            const space = await spaceCollection.findOne({ _id: link.spaceId } as any);
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

        const collection = await getTenantCollection('asset_space_links', session);
        return await collection.deleteOne({ assetId, spaceId });
    }

    /**
     * Moves an asset from one space to another (Changing primary spaceId).
     */
    static async moveAsset(assetId: EntityId, spaceId: EntityId, tenantId: TenantId, session?: TenantSession) {

        // 1. Get new space config
        const collection = await getTenantCollection<Space>(this.COLLECTION, session);
        const space = await collection.findOne({ _id: spaceId } as unknown as Filter<Space>);
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
        const linksCollection = await getTenantCollection('asset_space_links', session);
        await linksCollection.updateOne(
            { assetId, isPrimary: true },
            { $set: { spaceId, spacePath: newPath } }
        );

        await logEvento({
            level: 'INFO',
            source: 'SPACE_SERVICE',
            action: 'MOVE_ASSET',
            message: `Asset ${assetId} moved to space ${spaceId}`,
            tenantId,
            details: { assetId, newSpaceId: spaceId, newPath }
        });
    }

    /**
     * Sets a space as primary for an asset.
     */
    static async setPrimarySpace(assetId: EntityId, spaceId: EntityId, tenantId: TenantId, session?: TenantSession) {

        const linksCollection = await getTenantCollection('asset_space_links', session);

        // 1. Remove primary flag from all asset links
        await linksCollection.updateMany(
            { assetId },
            { $set: { isPrimary: false } }
        );

        // 2. Set the new primary
        const result = await linksCollection.updateOne(
            { assetId, spaceId },
            { $set: { isPrimary: true } }
        );

        if (result.matchedCount === 0) {
            throw new ValidationError('The link does not exist');
        }

        // 3. Sync with KnowledgeAsset (Primary Source of Truth)
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
            message: `Space ${spaceId} marked as primary for asset ${assetId}`,
            tenantId,
            details: { assetId, spaceId }
        });
    }
}
