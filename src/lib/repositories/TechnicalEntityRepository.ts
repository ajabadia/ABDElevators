import { BaseRepository } from './BaseRepository';
import { Entity } from '@/lib/schemas';

/**
 * 🏛️ TechnicalEntityRepository (Era 8)
 * Repositorio para la gestión de entidades técnicas analizadas.
 * Cluster: MAIN
 */
export class TechnicalEntityRepository extends BaseRepository<Entity> {
    protected readonly collectionName = 'entities';

    /**
     * Busca por hash MD5 para deduplicación.
     */
    async findByHash(md5Hash: string, tenantId: string): Promise<Entity | null> {
        const collection = await this.getCollection();
        return await collection.findOne({ md5Hash, tenantId }) as Entity | null;
    }
}

export const technicalEntityRepository = new TechnicalEntityRepository();
