
import { generateEmbedding } from '@/services/llm/llm-service';
import { withLLMRetry } from '@/services/llm/llm-retry';
import { logEvento } from '@/lib/logger';
import { AI_MODEL_IDS } from '@abd/platform-core';
import { LLMCostTracker } from '@/services/ingest/observability/LLMCostTracker';

/**
 * 🧬 Ingest Embedding Service
 * Proposito: Centralizar la generación de embeddings (Gemini + BGE) y tracking de costos.
 */
export class IngestEmbeddingService {
    /**
     * Genera un embedding de Gemini con reintentos y fallback determinista.
     */
    static async generateGeminiEmbedding(text: string, tenantId: string, correlationId: string, session?: any): Promise<number[] | undefined> {
        try {
            const start = Date.now();
            const embedding = await withLLMRetry(
                () => generateEmbedding(text, tenantId, correlationId, session),
                { operation: 'EMBEDDING_GEMINI', tenantId, correlationId },
                { maxRetries: 2, timeoutMs: 30000 }
            );

            if (embedding) {
                const tokens = Math.ceil(text.length / 4);
                await LLMCostTracker.trackOperation(
                    correlationId, 'EMBEDDING', AI_MODEL_IDS.EMBEDDING_1_0,
                    tokens, 0, Date.now() - start
                );
            }
            return embedding;
        } catch (error: any) {
            if (error.status === 429) {
                await logEvento({
                    level: 'WARN', source: 'EMBEDDING_SERVICE', action: 'QUOTA_EXHAUSTED',
                    message: 'Gemini Quota exhausted. Skipping vector.', correlationId, tenantId
                });
                return undefined;
            }
            throw error;
        }
    }

    /**
     * Genera un embedding multilingüe (BGE).
     */
    static async generateBGEEmbedding(text: string): Promise<number[]> {
        const { multilingualService } = await import('@/services/core/multilingual-service');
        return await multilingualService.generateEmbedding(text);
    }
}
