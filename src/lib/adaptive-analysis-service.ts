import { PromptService } from "@/lib/prompt-service";
import { logEvento } from "@/lib/logger";
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { getGenAI, runShadowCall } from "./gemini-client";
import { UsageService } from "./usage-service";
import { AI_MODEL_IDS, DEFAULT_MODEL } from '@abd/platform-core';
import { EntityEngine } from '@/core/engine/EntityEngine';
import { AgentEngine } from '@/core/engine/AgentEngine';
import { ExternalServiceError } from "./errors";

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
                const engine = EntityEngine.getInstance();
                const agent = AgentEngine.getInstance();

                let renderedPrompt = engine.renderPrompt(entitySlug, 'analyze', { text });
                let modelName = DEFAULT_MODEL as any;

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

                const usage = (result.response as any).usageMetadata;
                if (usage) {
                    span.setAttribute('genai.tokens', usage.totalTokenCount);
                    await UsageService.trackLLM(tenantId, usage.totalTokenCount, modelName, correlationId);
                }

                span.setStatus({ code: SpanStatusCode.OK });
                return resultData;
            } catch (error: any) {
                span.recordException(error);
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });

                await logEvento({
                    level: 'ERROR',
                    source: 'ADAPTIVE_ANALYSIS_SERVICE',
                    action: 'ANALYSIS_ERROR',
                    message: `Error analizando ${entitySlug}: ${error.message}`,
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
