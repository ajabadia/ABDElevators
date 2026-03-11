import { BaseRepository } from './BaseRepository';
import { RagEvaluationSchema, type RagEvaluation } from '@/lib/schemas/rag-quality';

/**
 * 🧪 RagEvaluationRepository
 * Era 13: Standardized access to RAG quality evaluations.
 * Consolidates 'ragevaluations' collection under BaseRepository pattern.
 */
export class RagEvaluationRepository extends BaseRepository<RagEvaluation> {
    constructor() {
        super('rag_evaluations');
    }
}

export const ragEvaluationRepository = new RagEvaluationRepository();
