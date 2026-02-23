import { BaseRepository } from './BaseRepository';
import { ObjectId } from 'mongodb';

/**
 * 🏛️ TechnicalEntityRepository
 * Repositorio para la gestión de entidades técnicas analizadas.
 */
export class TechnicalEntityRepository extends BaseRepository<any> {
    protected readonly collectionName = 'entities';

    /**
     * Busca por hash MD5 para deduplicación.
     */
    async findByHash(md5Hash: string, tenantId: string) {
        const collection = await this.getCollection();
        return await collection.findOne({ md5Hash, tenantId } as any);
    }
}

export const technicalEntityRepository = new TechnicalEntityRepository();
