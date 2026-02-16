import { getTenantCollection } from '@/lib/db-tenant';
import { UserCollection, UserCollectionSchema } from '@/lib/schemas/collections';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

export class CollectionService {
    private static COLLECTION = 'user_collections';

    /**
     * Create a new collection (Notebook)
     */
    static async createCollection(tenantId: string, ownerUserId: string, data: Partial<UserCollection>, session?: any) {
        const correlationId = crypto.randomUUID();
        const collection = await getTenantCollection<UserCollection>(this.COLLECTION, session);

        const newCollection: UserCollection = UserCollectionSchema.parse({
            ...data,
            tenantId,
            ownerUserId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const result = await collection.insertOne(newCollection);

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
    static async getUserCollections(tenantId: string, userId: string, session?: any) {
        const collection = await getTenantCollection<UserCollection>(this.COLLECTION, session);

        // SecureCollection handles filter by tenantId and ownerUserId if session is present
        return await collection.find({ ownerUserId: userId });
    }

    /**
     * Add multiple assets to a collection
     */
    static async addAssetsToCollection(collectionId: string, assetIds: string[], userId: string, session?: any) {
        const correlationId = crypto.randomUUID();
        const collection = await getTenantCollection<UserCollection>(this.COLLECTION, session);

        const result = await collection.updateOne(
            { _id: new ObjectId(collectionId), ownerUserId: userId },
            {
                $addToSet: { assetIds: { $each: assetIds } } as any,
                $set: { updatedAt: new Date() } as any
            }
        );

        if (result.matchedCount === 0) {
            throw new AppError('NOT_FOUND', 404, 'Collection not found or access denied');
        }

        return result.modifiedCount > 0;
    }

    /**
     * Delete a collection (Soft delete)
     */
    static async deleteCollection(collectionId: string, userId: string, session?: any) {
        const collection = await getTenantCollection<UserCollection>(this.COLLECTION, session);

        const result = await collection.deleteOne({ _id: new ObjectId(collectionId), ownerUserId: userId }) as any;

        if (result.matchedCount === 0 && result.deletedCount === 0) {
            throw new AppError('NOT_FOUND', 404, 'Collection not found or access denied');
        }

        return true;
    }
}
