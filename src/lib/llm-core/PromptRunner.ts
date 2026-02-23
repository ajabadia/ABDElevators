import { z } from 'zod';
import { PromptRegistry } from './PromptRegistry';
import { LlmJsonParser } from './LlmJsonParser';
import { PromptService } from '@/services/llm/prompt-service';
import { callGemini, callGeminiExtended, runShadowCall } from '@/services/llm/llm-service';
import { logEvento } from '@/lib/logger';
import { getTenantCollection } from '@/lib/db-tenant';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { executeWithResilience } from '@/lib/resilience';

const tracer = trace.getTracer('abd-rag-platform');

/**
 * 🚀 PromptRunner (Era 7)
 * Unified orchestrator for executing LLM prompts.
 * Features: Structured Parsing, Tracing, Resilience, Shadow Execution.
 */
export class PromptRunner {
    /**
     * Executes a prompt and returns structured JSON.
     */
    static async runJson<T>(params: {
        key: string;
        variables: Record<string, any>;
        schema: z.ZodSchema<T>;
        tenantId: string;
        correlationId: string;
        session?: any;
        temperature?: number;
    }): Promise<T> {
        const { key, variables, schema, tenantId, correlationId, session, temperature = 0.1 } = params;

        return tracer.startActiveSpan(`llm.run_json.${key.toLowerCase()}`, {
            attributes: { 'tenant.id': tenantId, 'correlation.id': correlationId, 'prompt.key': key }
        }, async (span) => {
            const start = Date.now();

            try {
                // 1. Resolve Prompt (Dynamic + Shadow Support)
                const { production, shadow } = await PromptService.getPromptWithShadow(
                    key,
                    variables,
                    tenantId,
                    'GENERIC',
                    session
                );

                // 2. Execution Sombra (Async)
                if (shadow) {
                    runShadowCall(shadow.text, shadow.model, tenantId, correlationId, key, shadow.key).catch(e =>
                        console.error("[SHADOW ERROR]", e)
                    );
                }

                // 3. Main Execution via Service (which handles resilience and usage)
                const { text: rawResponse, usage } = await callGeminiExtended(production.text, tenantId, correlationId, {
                    model: production.model,
                    temperature
                });

                // 4. Parse JSON with Resilient Parser
                const parsed = LlmJsonParser.parse({
                    raw: rawResponse,
                    schema,
                    source: `PROMPT_RUNNER:${key}`,
                    correlationId,
                    tenantId
                });

                const duration = Date.now() - start;
                span.setAttribute('genai.duration_ms', duration);
                if (usage) span.setAttribute('genai.tokens', usage.total);
                span.setStatus({ code: SpanStatusCode.OK });

                // 5. Observability Log (Era 7)
                await logEvento({
                    level: 'INFO',
                    source: 'LLM_CORE',
                    action: 'PROMPT_RUNNER_SUCCESS',
                    message: `Prompt "${key}" executed in ${duration}ms`,
                    correlationId,
                    tenantId,
                    durationMs: duration,
                    tokenUsage: usage,
                    details: { key, model: production.model }
                });

                return parsed;

            } catch (error: any) {
                span.recordException(error);
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });

                await logEvento({
                    level: 'ERROR',
                    source: 'LLM_CORE',
                    action: 'PROMPT_RUNNER_FAILURE',
                    message: `Failed to execute prompt "${key}": ${error.message}`,
                    correlationId,
                    tenantId,
                    details: { key, variables: Object.keys(variables) }
                });
                throw error;
            } finally {
                span.end();
            }
        });
    }

    /**
     * Executes a prompt and returns raw text.
     */
    static async runText(params: {
        key: string;
        variables: Record<string, any>;
        tenantId: string;
        correlationId: string;
        session?: any;
        temperature?: number;
    }): Promise<string> {
        const { key, variables, tenantId, correlationId, session, temperature = 0.7 } = params;

        return tracer.startActiveSpan(`llm.run_text.${key.toLowerCase()}`, {
            attributes: { 'tenant.id': tenantId, 'correlation.id': correlationId, 'prompt.key': key }
        }, async (span) => {
            try {
                const { production } = await PromptService.getPromptWithShadow(
                    key,
                    variables,
                    tenantId,
                    'GENERIC',
                    session
                );

                const start = Date.now();
                const { text: result, usage } = await callGeminiExtended(production.text, tenantId, correlationId, {
                    model: production.model,
                    temperature
                });

                const duration = Date.now() - start;
                span.setAttribute('genai.duration_ms', duration);
                if (usage) span.setAttribute('genai.tokens', usage.total);
                span.setStatus({ code: SpanStatusCode.OK });

                // 3. Observability Log (Era 7)
                await logEvento({
                    level: 'INFO',
                    source: 'LLM_CORE',
                    action: 'PROMPT_RUNNER_SUCCESS',
                    message: `Prompt "${key}" executed in ${duration}ms`,
                    correlationId,
                    tenantId,
                    durationMs: duration,
                    tokenUsage: usage,
                    details: { key, model: production.model }
                });
                return result;
            } catch (error: any) {
                span.recordException(error);
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
                throw error;
            } finally {
                span.end();
            }
        });
    }
}
