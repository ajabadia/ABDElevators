import { BaseRepository } from './BaseRepository';
import { type RagOfflineExperimentResult } from '@/lib/schemas/knowledge';

/**
 * 🏛️ RagOfflineExperimentResultRepository
 * Repositorio para los resultados de experimentos RAG offline.
 * Cluster: MAIN (Resultados de auditoría/calidad persistentes)
 */
export class RagOfflineExperimentResultRepository extends BaseRepository<RagOfflineExperimentResult> {
    constructor() {
        super('rag_offline_experiment_results');
    }
}

export const ragOfflineExperimentResultRepository = new RagOfflineExperimentResultRepository();
