import { BaseRepository } from './BaseRepository';
import { AssetSpaceLinkSchema, type AssetSpaceLink } from '@/lib/schemas/spaces';
import { type ClientSession, type Filter } from 'mongodb';
import { type TenantSession } from '@/lib/db-tenant';
import { EntityId, TenantId } from '@/lib/schemas/common';
import { ValidationError, AppError } from '@/lib/errors';

/**
 * 🏛️ AssetSpaceLinkRepository
 * Repository for managing junction links between Assets and Spaces.
 * Phase 344: Relational Performance & Multi-Space support.
 */
export class AssetSpaceLinkRepository extends BaseRepository<AssetSpaceLink> {
    constructor() {
        super('asset_space_links');
    }

    /**
     * Finds links by Asset ID.
     */
    async findByAssetId(assetId: EntityId, session?: TenantSession | null): Promise<AssetSpaceLink[]> {
        return await this.list({ assetId } as any, {}, session);
    }

    /**
     * Finds links by Space Path prefix (hierarchical listing).
     */
    async findByPathPrefix(pathPrefix: string, session?: TenantSession | null): Promise<AssetSpaceLink[]> {
        return await this.list({
            spacePath: { $regex: `^${pathPrefix}` }
        } as any, {}, session);
    }

    /**
     * Creates a new link validating against the schema.
     */
    async create(data: Omit<AssetSpaceLink, '_id'>, session?: TenantSession | null, mongoSession?: ClientSession): Promise<EntityId> {
        const validated = AssetSpaceLinkSchema.parse(data);
        return await super.create(validated as any, session, mongoSession);
    }

    /**
     * Bulk update links in a hierarchy (Space move sync).
     */
    async updatePaths(oldPath: string, newPath: string, session?: TenantSession | null, mongoSession?: ClientSession): Promise<number> {
        const collection = await this.getCollection(session);
        const result = await collection.updateMany(
            { spacePath: { $regex: `^${oldPath}` } } as any,
            [{
                $set: {
                    spacePath: {
                        $concat: [newPath, { $substr: ["$spacePath", oldPath.length, -1] }]
                    }
                }
            }],
            { session: mongoSession } as any
        );
        return result.modifiedCount;
    }

    /**
     * Deletes a specific link.
     */
    async deleteByAssetAndSpace(assetId: EntityId, spaceId: EntityId, session?: TenantSession | null): Promise<boolean> {
        const collection = await this.getCollection(session);
        const result = await collection.deleteOne({ assetId, spaceId } as any);
        return result.deletedCount > 0;
    }

    /**
     * Updates path for a primary link.
     */
    async updatePrimaryPath(assetId: EntityId, spaceId: EntityId, newPath: string, session?: TenantSession | null): Promise<boolean> {
        const collection = await this.getCollection(session);
        const result = await collection.updateOne(
            { assetId, isPrimary: true } as any,
            { $set: { spaceId, spacePath: newPath } as any }
        );
        return result.matchedCount > 0;
    }

    /**
     * Marks a space as primary for an asset and unmarks others.
     */
    async setPrimaryLink(assetId: EntityId, spaceId: EntityId, session?: TenantSession | null): Promise<void> {
        const collection = await this.getCollection(session);
        
        // 1. Unmark all
        await collection.updateMany(
            { assetId } as any,
            { $set: { isPrimary: false } as any }
        );

        // 2. Mark new primary
        const result = await collection.updateOne(
            { assetId, spaceId } as any,
            { $set: { isPrimary: true } as any }
        );

        if (result.matchedCount === 0) {
            throw new ValidationError('The link does not exist');
        }
    }
}

export const assetSpaceLinkRepository = new AssetSpaceLinkRepository();
