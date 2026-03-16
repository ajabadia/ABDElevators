import { generateEmbedding } from '@/services/llm/llm-service';
import { withLLMRetry } from '@/services/llm/llm-retry';
import { logEvento } from '@/lib/logger';
import { AI_MODEL_IDS } from '@abd/platform-core';
import { LLMCostTracker } from '@/services/ingest/observability/LLMCostTracker';
import { TenantSession } from '@/lib/db-tenant';
import { AiModelManager } from '@/services/core/ai-model-manager';

/**
 * 🧬 Ingest Embedding Service
 * Proposito: Centralizar la generación de embeddings.
 * 
 * ESTRATEGIA:
 * - Deterministas (Arctic-Embed / Local): OPCIÓN POR DEFECTO para Simple y Avanzado.
 * - Cloud (Gemini): Opción PREMIUM o redundancia de alta calidad.
 */
export class IngestEmbeddingService {
    /**
     * Genera embeddings siguiendo la jerarquía de gobernanza:
     * 1. Si es Premium y está habilitado: Gemini.
     * 2. Default (Simple/Avanzado): Arctic-Embed (Local/Determinista).
     */
    static async generateEmbeddings(text: string, tenantId: string, correlationId: string, options: { 
        isPremium?: boolean,
        forceCloud?: boolean,
        session?: TenantSession 
    }): Promise<number[]> {
        
        // 1. Intentar Gemini si es Premium o se solicita explícitamente
        if (options.isPremium || options.forceCloud) {
            const geminiEmbedding = await this.generateGeminiEmbedding(text, tenantId, correlationId, options.session);
            if (geminiEmbedding) return geminiEmbedding;
            
            console.log(`[EMBEDDING_SERVICE] Cloud embedding falló o no disponible. Cayendo a Determinista Local.`);
        }

        // 2. Default: Local Determinista (Arctic-Embed)
        return await this.generateLocalEmbedding(text);
    }

    /**
     * Genera un embedding de Gemini con reintentos.
     */
    static async generateGeminiEmbedding(text: string, tenantId: string, correlationId: string, session?: TenantSession): Promise<number[] | undefined> {
        try {
            const start = Date.now();
            const sessionForConfig: TenantSession = session || { user: { id: 'system', tenantId, role: 'SYSTEM', email: 'system@platform.local' } };
            const config = await AiModelManager.getTenantAiConfig(sessionForConfig);
            const embeddingModel = config.embeddingModel || AI_MODEL_IDS.EMBEDDING_1_0;

            const embedding = await withLLMRetry(
                () => generateEmbedding(text, tenantId, correlationId, session),
                { operation: 'EMBEDDING_GEMINI', tenantId, correlationId },
                { maxRetries: 2, timeoutMs: 30000 }
            );

            if (embedding) {
                const tokens = Math.ceil(text.length / 4);
                await LLMCostTracker.trackOperation(
                    correlationId, 'EMBEDDING', embeddingModel,
                    tokens, 0, Date.now() - start
                );
            }
            return embedding;
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            await logEvento({
                level: 'WARN', 
                source: 'EMBEDDING_SERVICE', 
                action: 'CLOUD_EMBEDDING_SKIPPED',
                message: `Gemini skipped: ${err.message}`, 
                correlationId, 
                tenantId
            });
            return undefined;
        }
    }

    /**
     * Genera un embedding local determinista (Snowflake Arctic-Embed v2.0).
     */
    static async generateLocalEmbedding(text: string): Promise<number[]> {
        const { multilingualService } = await import('@/services/core/multilingual-service');
        return await multilingualService.generateEmbedding(text);
    }
}
