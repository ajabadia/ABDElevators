import { performTechnicalSearch, hybridSearch, truncateContext, getRelevantDocuments } from '@abd/rag-engine/server';
import { RagResult } from '@abd/rag-engine';

/**
 * RagService (FASE 222: Consolidation)
 * Entry point for RAG operations, wrapping the low-level rag-engine package.
 */
export class RagService {
    /**
     * Perform a technical search across chunks.
     */
    static async performTechnicalSearch(
        query: string,
        tenantId: string,
        correlationId: string,
        limit: number = 5,
        industry: string = 'GENERIC',
        options?: any
    ) {
        return await performTechnicalSearch(query, tenantId, correlationId, limit, industry, options?.environment, options?.spaceId, options?.filename);
    }

    /**
     * Get relevant documents for a query.
     */
    static async getRelevantDocuments(query: string, tenantId: string, correlationId: string, limit: number = 5) {
        return await getRelevantDocuments(query, tenantId, { topK: limit, correlationId });
    }

    /**
     * Hybrid search across chunks.
     */
    static async hybridSearch(query: string, tenantId: string, correlationId: string, industry: string, options?: any) {
        return await hybridSearch(query, tenantId, correlationId, industry, options);
    }
}

export type { RagResult };
