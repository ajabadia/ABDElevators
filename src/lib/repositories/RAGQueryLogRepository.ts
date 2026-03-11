import { BaseRepository } from './BaseRepository';
import { RAGQueryLogSchema, type RAGQueryLog } from '@/lib/schemas/rag-quality';

export class RAGQueryLogRepository extends BaseRepository<RAGQueryLog> {
    constructor() {
        super('rag_query_logs');
    }
}

export const ragQueryLogRepository = new RAGQueryLogRepository();
