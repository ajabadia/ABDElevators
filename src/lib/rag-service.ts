/**
 * ⚡ FASE 182: RAG Domain Decoupling
 * Compatibility Bridge: Points to @abd/rag-engine
 */
export * from '@abd/rag-engine/server';

import { VectorSearchService } from '@abd/rag-engine/server';
export const pureVectorSearch = VectorSearchService.pureVectorSearch.bind(VectorSearchService);
