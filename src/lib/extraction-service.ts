import { PromptService } from "@/lib/prompt-service";
import { logEvento } from "@/lib/logger";
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { getGenAI, runShadowCall } from "./gemini-client";
import { UsageService } from "./usage-service";
import { executeWithResilience } from "./resilience";
import { ExternalServiceError } from "./errors";
import { z } from "zod";

const tracer = trace.getTracer('abd-rag-platform');

const ExtractModelsSchema = z.object({
    text: z.string().min(1),
    correlationId: z.string()
});

const ExtractedModelsArraySchema = z.array(z.object({
    type: z.string(),
    model: z.string()
}));

export class ExtractionService {
    /**
     * Extrae modelos y entidades de un texto de pedido.
     */
    static async extractModelsWithGemini(text: string, tenantId: string, correlationId: string, session?: any) {
        return tracer.startActiveSpan('gemini.extract_models', {
            attributes: {
                'tenant.id': tenantId,
                'correlation.id': correlationId
            }
        }, async (span) => {
            try {
                ExtractModelsSchema.parse({ text, correlationId });
                const start = Date.now();

                const genAI = getGenAI();

                // Renderizar el prompt dinámico y obtener el modelo configurado
                const { production, shadow } = await PromptService.getPromptWithShadow(
                    'EXTRAER_MODELOS',
                    { text },
                    tenantId,
                    'GENERIC',
                    session
                );

                const renderedPrompt = production.text;
                const modelName = production.model;

                if (shadow) {
                    runShadowCall(shadow.text, shadow.model, tenantId, correlationId, 'MODEL_EXTRACTOR', shadow.key).catch((e: Error) =>
                        console.error("[SHADOW ORCHESTRATION ERROR]", e)
                    );
                }

                span.setAttribute('genai.model', modelName);

                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await executeWithResilience(
                    'GEMINI_EXTRACTION',
                    'EXTRACT_MODELS',
                    () => model.generateContent(renderedPrompt),
                    correlationId,
                    tenantId
                ) as any;
                const responseText = result.response.text();
                const duration = Date.now() - start;
                span.setAttribute('genai.duration_ms', duration);

                // 3. Limpiar y parsear JSON de la respuesta (Phase 192 Resilience)
                const cleanJson = responseText
                    .replace(/```json/g, '')
                    .replace(/```/g, '')
                    .trim();

                const jsonMatch = cleanJson.match(/\[[\s\S]*\]/);
                if (!jsonMatch) {
                    console.error("[EXTRACTION ERROR] No JSON array found in:", responseText);
                    throw new ExternalServiceError('No valid JSON array found in Gemini response');
                }

                let modelos;
                try {
                    modelos = JSON.parse(jsonMatch[0]);
                    ExtractedModelsArraySchema.parse(modelos);
                    span.setAttribute('extraction.count', modelos.length);
                } catch (parseError) {
                    console.error("[EXTRACTION PARSE ERROR] Invalid JSON or Schema:", jsonMatch[0]);
                    throw new ExternalServiceError('Failed to parse or validate Gemini response as expected JSON array', parseError as Error);
                }

                const usage = (result.response as any).usageMetadata;
                if (usage) {
                    span.setAttribute('genai.tokens', usage.totalTokenCount);
                    await UsageService.trackLLM(tenantId, usage.totalTokenCount, modelName, correlationId, session);

                    // Phase 2: Track cost with LLMCostTracker
                    const { LLMCostTracker } = await import('@/services/ingest/observability/LLMCostTracker');
                    const inputTokens = usage.promptTokenCount || Math.ceil(renderedPrompt.length / 4);
                    const outputTokens = usage.candidatesTokenCount || Math.ceil(responseText.length / 4);

                    await LLMCostTracker.trackOperation(
                        correlationId,
                        'MODEL_EXTRACTION',
                        modelName,
                        inputTokens,
                        outputTokens,
                        duration
                    );
                }

                span.setStatus({ code: SpanStatusCode.OK });
                return modelos;
            } catch (error) {
                span.recordException(error as Error);
                span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });

                await logEvento({
                    level: 'ERROR',
                    source: 'EXTRACTION_SERVICE',
                    action: 'EXTRACT_ERROR',
                    message: `Fallo en extracción Gemini: ${(error as Error).message}`,
                    correlationId,
                    stack: (error as Error).stack
                });
                throw error;
            } finally {
                span.end();
            }
        });
    }
}
