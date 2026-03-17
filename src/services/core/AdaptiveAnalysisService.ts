import { PromptService } from "@/services/llm/prompt-service";
import { logEvento } from "@/lib/logger";
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { getGenAI, runShadowCall } from "@/lib/gemini-client";
import { UsageService } from "@/services/ops/usage-service";
import { AI_MODEL_IDS, DEFAULT_MODEL } from '@/lib/constants/ai-models';
import { ExternalServiceError } from "@/lib/errors";
import { getEntityEngine } from "@/core/engine";
import { getAgentEngine } from "@/core/engine/index.server";
import { PromptRunner } from "@/lib/llm-core/PromptRunner";
import { AiModelManager } from "@/services/core/ai-model-manager";
import { z } from "zod";

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

                // 3. Execution
                let responseText: string;
                let usageMetadata: { totalTokenCount: number } | undefined;

                if (!renderedPrompt) {
                   // Clean path using PromptRunner.runJson if possible
                   const baseSchema = z.array(z.any()); // Legacy support for various model list formats
                   const result = await PromptRunner.runJson({
                       key: 'MODEL_EXTRACTOR',
                       variables: { text },
                       schema: baseSchema,
                       tenantId,
                       correlationId
                   });
                   return result;
                }

                // Ontology path: Use PromptRunner.call for existing rendered prompts
                responseText = await PromptRunner.call({
                    prompt: renderedPrompt,
                    tenantId,
                    correlationId,
                    options: { model: modelName }
                });

                const jsonMatch = responseText.match(/\[[\s\S]*\]/);
                if (!jsonMatch) {
                    throw new ExternalServiceError('No hay JSON válido en la respuesta de Gemini');
                }

                let resultData;
                try {
                    resultData = JSON.parse(jsonMatch[0]);
                } catch (e) {
                    throw new ExternalServiceError('Error parseando JSON de respuesta');
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
