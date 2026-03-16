import { PromptService } from "@/services/llm/prompt-service";
import { logEvento } from "@/lib/logger";
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { getGenAI, runShadowCall } from "@/lib/gemini-client";
import { UsageService } from "@/services/ops/usage-service";
import { AI_MODEL_IDS, DEFAULT_MODEL } from '@abd/platform-core';
import { ExternalServiceError } from "@/lib/errors";
import { getEntityEngine } from "@/core/engine";
import { getAgentEngine } from "@/core/engine/index.server";

const tracer = trace.getTracer('abd-rag-platform');

export class AdaptiveAnalysisService {
    /**
     * Analiza una entidad usando prompts adaptativos de la ontología. (Fase 5)
     */
    static async analyzeEntityWithGemini(
        entitySlug: string,
        text: string,
        tenantId: string,
        correlationId: string
    ) {
        return tracer.startActiveSpan('gemini.analyze_entity', {
            attributes: {
                'tenant.id': tenantId,
                'correlation.id': correlationId,
                'entity.slug': entitySlug
            }
        }, async (span) => {
            try {
                const start = Date.now();
                const engine = getEntityEngine();
                const agent = getAgentEngine();

                let renderedPrompt = engine.renderPrompt(entitySlug, 'analyze', { text });
                let modelName: string = DEFAULT_MODEL;

                // Inyectar aprendizaje del contexto del agente (Feedback Loop)
                const learningContext = await agent.getCorrectionContext(entitySlug, tenantId);
                if (learningContext) {
                    renderedPrompt += learningContext;
                    span.setAttribute('agent.learning_injected', true);
                }

                // Fallback a PromptService si no hay prompt en ontología
                if (!renderedPrompt) {
                    const { production, shadow } = await PromptService.getPromptWithShadow('MODEL_EXTRACTOR', { text }, tenantId);
                    renderedPrompt = production.text;
                    modelName = production.model;

                    if (shadow) {
                        runShadowCall(shadow.text, shadow.model, tenantId, correlationId, 'MODEL_ADAPTIVE', shadow.key).catch(console.error);
                    }
                    span.setAttribute('prompt.source', 'legacy_db');
                } else {
                    span.setAttribute('prompt.source', 'ontology');
                }

                span.setAttribute('genai.model', modelName);

                const genAI = getGenAI();
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(renderedPrompt);
                const responseText = result.response.text();

                const jsonMatch = responseText.match(/\[[\s\S]*\]/);
                if (!jsonMatch) {
                    throw new ExternalServiceError('No hay JSON válido en la respuesta de Gemini');
                }

                let resultData = JSON.parse(jsonMatch[0]);

                const response = result.response as any;
                const usage = response.usageMetadata;
                if (usage) {
                    const totalTokens = usage.totalTokenCount || 0;
                    span.setAttribute('genai.tokens', totalTokens);
                    await UsageService.trackLLM(tenantId, totalTokens, modelName, correlationId);
                }

                span.setStatus({ code: SpanStatusCode.OK });
                return resultData;
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                span.recordException(error as Error);
                span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });

                await logEvento({
                    level: 'ERROR',
                    source: 'ADAPTIVE_ANALYSIS_SERVICE',
                    action: 'ANALYSIS_ERROR',
                    message: `Error analizando ${entitySlug}: ${errorMessage}`,
                    correlationId,
                    details: { entitySlug }
                });
                throw error;
            } finally {
                span.end();
            }
        });
    }
}
