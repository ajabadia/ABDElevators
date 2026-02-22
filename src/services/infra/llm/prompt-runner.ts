import { PromptService } from '@/lib/prompt-service';
import { DEFAULT_PROMPTS } from '@/lib/prompts/core-definitions';
import { getGenAI, runShadowCall } from '@/lib/gemini-client';
import { LlmJsonUtils } from '@/lib/llm/json-utils';
import { logEvento } from '@/lib/logger';
import { CorrelationIdService } from '../../common/CorrelationIdService';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { executeWithResilience } from '@/lib/resilience';
import { UsageService } from '@/lib/usage-service';

const tracer = trace.getTracer('abd-rag-platform');

/**
 * 🧠 Prompt Runner
 * Engine unificado para la ejecución de prompts con tracing, resiliencia y tracking de costes.
 */
export class PromptRunner {
    /**
     * Ejecuta un prompt y devuelve el texto plano.
     */
    static async runTextPrompt(params: {
        key: string;
        variables: Record<string, any>;
        tenantId: string;
        correlationId?: string;
        modelOverride?: string;
        session?: any;
    }): Promise<string> {
        const cid = params.correlationId || CorrelationIdService.generate();
        const { tenantId, key, variables, session } = params;

        return tracer.startActiveSpan(`llm.run.${key.toLowerCase()}`, {
            attributes: { 'tenant.id': tenantId, 'correlation.id': cid, 'prompt.key': key }
        }, async (span) => {
            try {
                const startTime = Date.now();

                // 1. Resolver Prompt (Producción + Sombra)
                const { production, shadow } = await PromptService.getPromptWithShadow(
                    key,
                    variables,
                    tenantId,
                    'GENERIC',
                    session
                );

                const modelName = params.modelOverride || production.model;
                const renderedPrompt = production.text;
                span.setAttribute('genai.model', modelName);

                // 2. Ejecución Sombra (Async)
                if (shadow) {
                    runShadowCall(shadow.text, shadow.model, tenantId, cid, key, shadow.key).catch(e =>
                        console.error("[SHADOW ERROR]", e)
                    );
                }

                // 3. Ejecución Principal con Resiliencia
                const genAI = getGenAI();
                const model = genAI.getGenerativeModel({ model: modelName });

                const result = await executeWithResilience(
                    'LLM_EXECUTION',
                    key,
                    () => model.generateContent(renderedPrompt),
                    cid,
                    tenantId
                ) as any;

                const responseText = result.response.text();
                const duration = Date.now() - startTime;
                span.setAttribute('genai.duration_ms', duration);

                // 4. Tracking de Uso y Coste
                const usage = result.response.usageMetadata;
                if (usage) {
                    span.setAttribute('genai.tokens', usage.totalTokenCount);
                    await UsageService.trackLLM(tenantId, usage.totalTokenCount, modelName, cid, session);

                    // Tracking de coste específico
                    const { LLMCostTracker } = await import('@/services/ingest/observability/LLMCostTracker').catch(() => ({ LLMCostTracker: null }));
                    if (LLMCostTracker) {
                        await LLMCostTracker.trackOperation(
                            cid,
                            key,
                            modelName,
                            usage.promptTokenCount || 0,
                            usage.candidatesTokenCount || 0,
                            duration
                        );
                    }
                }

                span.setStatus({ code: SpanStatusCode.OK });
                return responseText;

            } catch (error: any) {
                span.recordException(error);
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });

                await logEvento({
                    level: 'ERROR',
                    source: 'PROMPT_RUNNER',
                    action: 'EXECUTION_ERROR',
                    message: `Error ejecutando ${key}: ${error.message}`,
                    correlationId: cid,
                    tenantId,
                    details: { key, variables }
                });
                throw error;
            } finally {
                span.end();
            }
        });
    }

    /**
     * Ejecuta un prompt y parsea el resultado como JSON.
     */
    static async runJsonPrompt<T>(params: {
        key: string;
        variables: Record<string, any>;
        tenantId: string;
        correlationId?: string;
        modelOverride?: string;
        session?: any;
    }): Promise<T> {
        const text = await this.runTextPrompt(params);
        return LlmJsonUtils.safeParseLLMJson<T>(text, params.correlationId) as T;
    }
}
