import { BaseRepository } from './BaseRepository';
import { KnowledgeAssetSchema } from '@/lib/schemas';

/**
 * 🏛️ KnowledgeAssetRepository
 * Repositorio centralizado para activos de conocimiento.
 */
export class KnowledgeAssetRepository extends BaseRepository<any> {
    protected readonly collectionName = 'knowledge_assets';

    /**
     * Sobrescribe create para añadir validación de esquema Zod específica.
     */
    async create(data: any, session?: any): Promise<string> {
        const validated = KnowledgeAssetSchema.parse(data);
        return await super.create(validated, session);
    }
}

export const knowledgeAssetRepository = new KnowledgeAssetRepository();
