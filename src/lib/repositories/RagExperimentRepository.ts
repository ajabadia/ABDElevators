import { BaseRepository } from './BaseRepository';
import { RagExperiment } from '@/lib/schemas/rag-experiment';

/**
 * 🏛️ RagExperimentRepository
 * Repositorio para experimentos RAG.
 */
export class RagExperimentRepository extends BaseRepository<RagExperiment> {
    constructor() {
        super('rag_experiments');
    }
}

export const ragExperimentRepository = new RagExperimentRepository();
