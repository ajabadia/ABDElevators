import { BaseRepository } from './BaseRepository';
import { RagExperiment } from '@/lib/schemas/rag-experiment';

/**
 * 🏛️ RagExperimentRepository
 * Repositorio para experimentos RAG.
 */
export class RagExperimentRepository extends BaseRepository<RagExperiment> {
    protected readonly collectionName = 'rag_experiments';
}

export const ragExperimentRepository = new RagExperimentRepository();
