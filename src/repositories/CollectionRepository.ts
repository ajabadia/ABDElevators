
import { BaseRepository } from '@/lib/repository/BaseRepository';
import { UserCollection, UserCollectionSchema } from '@/lib/schemas/collections';
import { ObjectId } from 'mongodb';

/**
 * 🏛️ Collection Repository
 * Proposito: Acceso a datos para la colección 'user_collections'.
 */
export class CollectionRepository extends BaseRepository<UserCollection> {
    private static instance: CollectionRepository;

    private constructor() {
        super('user_collections');
    }

    static getInstance(): CollectionRepository {
        if (!CollectionRepository.instance) {
            CollectionRepository.instance = new CollectionRepository();
        }
        return CollectionRepository.instance;
    }

    /**
     * Busca colecciones accesibles por un usuario.
     */
    async findByOwner(userId: string, session?: any): Promise<UserCollection[]> {
        return await this.find({ ownerUserId: userId }, {}, session);
    }

    /**
     * Agrega múltiples activos a una colección de forma atómica.
     */
    async addAssets(collectionId: string, assetIds: string[], userId: string, session?: any) {
        return await this.update(
            collectionId,
            {
                $addToSet: { assetIds: { $each: assetIds } } as any,
                $set: { updatedAt: new Date() } as any
            },
            {},
            session
        );
    }
}

export const collectionRepository = CollectionRepository.getInstance();
