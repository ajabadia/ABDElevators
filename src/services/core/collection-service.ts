
import { UserCollection, UserCollectionSchema } from '@/lib/schemas/collections';
import { TenantSession } from '@/lib/db-tenant';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { collectionRepository } from '@/repositories/CollectionRepository';
import { CorrelationIdService } from '@/services/observability/CorrelationIdService';

/**
 * 📁 Collection Service
 * Proposito: Lógica de negocio para la gestión de colecciones personalizadas (Notebooks).
 */
export class CollectionService {
    /**
     * Create a new collection (Notebook)
     */
    static async createCollection(tenantId: string, ownerUserId: string, data: Partial<UserCollection>, session?: TenantSession | null) {
        const correlationId = CorrelationIdService.generate();

        const newCollection: UserCollection = UserCollectionSchema.parse({
            ...data,
            tenantId,
            ownerUserId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const result = await collectionRepository.create(newCollection, {}, session);

        await logEvento({
            level: 'INFO',
            source: 'COLLECTION_SERVICE',
            action: 'CREATE_COLLECTION',
            message: `Collection '${newCollection.name}' created by user ${ownerUserId}`,
            correlationId,
            tenantId,
            details: { collectionId: result.insertedId }
        });

        return result.insertedId;
    }

    /**
     * Get accessible collections for a user
     */
    static async getUserCollections(tenantId: string, userId: string, session?: TenantSession | null) {
        return await collectionRepository.findByOwner(userId, session);
    }

    /**
     * Add multiple assets to a collection
     */
    static async addAssetsToCollection(collectionId: string, assetIds: string[], userId: string, session?: TenantSession | null) {
        const correlationId = CorrelationIdService.generate();

        const result = await collectionRepository.addAssets(collectionId, assetIds, userId, session);

        if (result.matchedCount === 0) {
            throw new AppError('NOT_FOUND', 404, 'Collection not found or access denied');
        }

        return result.modifiedCount > 0;
    }

    /**
     * Delete a collection
     */
    static async deleteCollection(collectionId: string, userId: string, session?: TenantSession | null) {
        const result = await collectionRepository.deletePhysical(collectionId, {}, session);

        if (result.deletedCount === 0) {
            throw new AppError('NOT_FOUND', 404, 'Collection not found or access denied');
        }

        return true;
    }
}
