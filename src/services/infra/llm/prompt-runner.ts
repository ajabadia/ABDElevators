import { PromptService } from '@/services/llm/prompt-service';
import { getGenAI, runShadowCall } from '@/lib/gemini-client';
import { LlmJsonUtils } from '@/services/llm/json-utils';
import { logEvento } from '@/lib/logger';
import { CorrelationIdService } from '@/services/observability/CorrelationIdService';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { executeWithResilience } from '@/lib/resilience';
import { UsageService } from '@/services/ops/usage-service';

const tracer = trace.getTracer('abd-rag-platform');

/**
 * 🧠 Infra Prompt Runner (Intermediate - Era 7)
 * Engine unificado para la ejecución de prompts con tracing, resiliencia y tracking de costes.
 * @deprecated Favor specialized use cases or lib/llm-core version.
 */
export class InfraPromptRunner {
    /**
     * Ejecuta un prompt y devuelve el texto plano.
     */
    static async runTextPrompt(
        key: string,
        variables: Record<string, any>,
        tenantId: string,
        correlationId: string,
        session?: any,
        options?: { modelOverride?: string; temperature?: number }
    ): Promise<string> {
        return tracer.startActiveSpan(`llm.run_text.${key.toLowerCase()}`, {
            attributes: { 'tenant.id': tenantId, 'correlation.id': correlationId, 'prompt.key': key }
        }, async (span) => {
            try {
                // 1. Resolve Prompt (DB -> Fallback)
                const { production, shadow } = await PromptService.getPromptWithShadow(
                    key,
                    variables,
                    tenantId,
                    'GENERIC',
                    session
                );

                // 2. Async Shadow Execution (No bloqueante)
                if (shadow) {
                    runShadowCall(shadow.text, shadow.model, tenantId, correlationId, key, shadow.key).catch(e =>
                        console.error("[SHADOW ERROR]", e)
                    );
                }

                const modelToUse = options?.modelOverride || production.model;

                // 3. Main Execution with Resilience
                const result = await executeWithResilience(
                    'PROMPT_RUNNER',
                    `RUN_TEXT_${key}`,
                    async () => {
                        const genAI = getGenAI();
                        const model = genAI.getGenerativeModel({ model: modelToUse });
                        return await model.generateContent(production.text);
                    },
                    correlationId,
                    tenantId
                ) as any;

                const text = result.response.text();

                // 4. Token Usage Tracking
                if (result.response.usageMetadata) {
                    await UsageService.trackUsage(tenantId, {
                        type: 'LLM_TOKENS',
                        value: result.response.usageMetadata.totalTokenCount,
                        resource: modelToUse,
                        description: `Execution of prompt: ${key}`,
                        correlationId
                    });
                }

                span.setStatus({ code: SpanStatusCode.OK });
                return text;

            } catch (error: any) {
                span.recordException(error);
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
                throw error;
            } finally {
                span.end();
            }
        });
    }

    /**
     * Ejecuta un prompt y parsea el resultado como JSON.
     */
    static async runJsonPrompt<T>(
        key: string,
        variables: Record<string, any>,
        tenantId: string,
        correlationId: string,
        session?: any,
        options?: { modelOverride?: string; temperature?: number }
    ): Promise<T> {
        const text = await this.runTextPrompt(key, variables, tenantId, correlationId, session, options);
        return LlmJsonUtils.safeParseLLMJson<T>(text, correlationId) as T;
    }
}
