import { callGeminiMini } from '@/lib/llm';
import { PromptService } from '@/lib/prompt-service';
import { PROMPTS } from '@/lib/prompts';
import { logEvento } from '@/lib/logger';
import { DEFAULT_MODEL } from '@/lib/constants/ai-models';

/**
 * 🧠 Cognitive Retrieval Service (Phase 102)
 * Generates document-level context to enrich individual chunks.
 */
export class CognitiveRetrievalService {
    /**
     * Generates a concise context header for the entire document.
     */
    static async generateDocumentContext(
        text: string,
        industry: string,
        tenantId: string,
        correlationId?: string,
        session?: any
    ): Promise<string> {
        let renderedPrompt: string;
        let modelName: string = DEFAULT_MODEL;

        try {
            const { text: promptText, model } = await PromptService.getRenderedPrompt(
                'COGNITIVE_CONTEXT',
                {
                    text: text.substring(0, 5000),
                    industry: industry.toLowerCase()
                },
                tenantId,
                'PRODUCTION',
                'GENERIC',
                session
            );
            renderedPrompt = promptText;
            modelName = model || DEFAULT_MODEL;
        } catch (error) {
            console.warn(`[COGNITIVE_RETRIEVAL] ⚠️ Fallback to Master Prompt:`, error);
            await logEvento({
                level: 'WARN',
                source: 'COGNITIVE_RETRIEVAL',
                action: 'PROMPT_FALLBACK',
                message: 'Usando prompt maestro por error en BD',
                correlationId: correlationId || 'cognitive-retrieval-fallback',
                tenantId
            });
            renderedPrompt = (PROMPTS.COGNITIVE_CONTEXT?.template || '')
                .replace('{{text}}', text.substring(0, 5000))
                .replace('{{industry}}', industry.toLowerCase());
        }

        // Phase 2: Wrap LLM call with retry + tracing + cost tracking
        const { IngestTracer } = await import('@/services/ingest/observability/IngestTracer');
        const { withLLMRetry } = await import('@/lib/llm-retry');
        const { LLMCostTracker } = await import('@/services/ingest/observability/LLMCostTracker');

        const span = IngestTracer.startCognitiveContextSpan({
            correlationId: correlationId || 'cognitive-router',
            tenantId,
        });

        try {
            const startTime = Date.now();

            const response = await withLLMRetry(
                () => callGeminiMini(renderedPrompt, tenantId, {
                    correlationId: correlationId || 'cognitive-router',
                    model: modelName
                }),
                {
                    operation: 'COGNITIVE_CONTEXT',
                    tenantId,
                    correlationId: correlationId || 'cognitive-router',
                },
                {
                    maxRetries: 3,
                    timeoutMs: 10000, // 10s timeout
                }
            );

            const durationMs = Date.now() - startTime;

            // Estimate tokens
            const inputTokens = Math.ceil(renderedPrompt.length / 4);
            const outputTokens = Math.ceil(response.length / 4);

            // Track cost
            await LLMCostTracker.trackOperation(
                correlationId || 'cognitive-router',
                'COGNITIVE_CONTEXT',
                modelName,
                inputTokens,
                outputTokens,
                durationMs
            );

            // End span success
            await IngestTracer.endSpanSuccess(span, {
                correlationId: correlationId || 'cognitive-router',
                tenantId,
            }, {
                'llm.tokens.input': inputTokens,
                'llm.tokens.output': outputTokens,
                'llm.model': modelName,
                'context.length': response.length,
            });

            return response.trim();
        } catch (error: any) {
            await IngestTracer.endSpanError(span, {
                correlationId: correlationId || 'cognitive-router',
                tenantId,
            }, error);

            console.error('[COGNITIVE RETRIEVAL ERROR]', error);
            return 'Documento técnico general sin contexto específico detectado.';
        }
    }
}
