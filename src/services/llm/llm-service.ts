
import { z } from "zod";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { ExternalServiceError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { UsageService } from '@/services/ops/usage-service';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { executeWithResilience } from '@/lib/resilience';
import { getGenAI, mapModelName, runShadowCall } from "@/lib/gemini-client";
import { DEFAULT_MODEL, AI_MODEL_IDS } from "@/lib/constants/ai-models";
import { AiModelManager } from "@/lib/services/ai-model-manager";

// Re-export core utilities for backward compatibility where needed
export { getGenAI, mapModelName, runShadowCall };

const tracer = trace.getTracer('abd-rag-platform');

const GenerateEmbeddingSchema = z.object({
    text: z.string().min(1),
    correlationId: z.string()
});

const CallGeminiMiniSchema = z.object({
    prompt: z.string().min(1),
    tenantId: z.string(),
    options: z.object({
        correlationId: z.string(),
        temperature: z.number().min(0).max(1).optional(),
        model: z.string().optional()
    })
});

/**
 * Genera embeddings para un bloque de texto.
 */
export async function generateEmbedding(text: string, tenantId: string, correlationId: string, session?: any): Promise<number[]> {
    return tracer.startActiveSpan('gemini.embed_content', {
        attributes: {
            'tenant.id': tenantId,
            'correlation.id': correlationId,
            'genai.model': AI_MODEL_IDS.EMBEDDING_1_0,
            'genai.text_length': text.length
        }
    }, async (span) => {
        try {
            GenerateEmbeddingSchema.parse({ text, correlationId });
            const start = Date.now();

            const config = await AiModelManager.getTenantAiConfig({ user: { tenantId } } as any);
            const embeddingModel = config.embeddingModel || AI_MODEL_IDS.EMBEDDING_1_0;

            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({ model: embeddingModel }, { apiVersion: 'v1beta' });

            const result = await executeWithResilience(
                'GEMINI_EMBEDDING',
                'EMBED_CONTENT',
                () => model.embedContent(text),
                correlationId,
                tenantId
            );

            const duration = Date.now() - start;
            span.setAttribute('genai.duration_ms', duration);

            if (duration > 1000) {
                await logEvento({
                    level: 'WARN',
                    source: 'GEMINI_EMBEDDING',
                    action: 'SLA_VIOLATION',
                    message: `Embedding lento: ${duration}ms`,
                    correlationId,
                    details: { durationMs: duration, textLength: text.length }
                });
            }

            await UsageService.trackLLM(tenantId, text.length / 4, AI_MODEL_IDS.EMBEDDING_1_0, correlationId, session);

            span.setStatus({ code: SpanStatusCode.OK });
            return result.embedding.values;
        } catch (error) {
            span.recordException(error as Error);
            span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });

            await logEvento({
                level: 'ERROR',
                source: 'GEMINI_EMBEDDING',
                action: 'EMBED_ERROR',
                message: `Fallo en embedding Gemini: ${(error as Error).message}`,
                correlationId,
                tenantId,
                stack: (error as Error).stack
            });
            throw new ExternalServiceError('Error generating embedding with Gemini', error as Error);
        } finally {
            span.end();
        }
    });
}

/**
 * Genera contenido con estrategia de fallback
 */
async function callGeminiDynamic(
    prompt: string,
    tenantId: string,
    options: { correlationId: string; temperature?: number; model?: string },
    session?: any
): Promise<string> {
    const { correlationId, temperature = 0.7, model: preferredModel } = options;

    try {
        return await callGeminiRecursive(prompt, tenantId, options, session);
    } catch (error: any) {
        const isQuotaError = error.message?.includes('429') || error.message?.includes('QUOTA_EXCEEDED');
        const primaryModel = preferredModel || DEFAULT_MODEL;

        if (isQuotaError && primaryModel !== DEFAULT_MODEL) {
            await logEvento({
                level: 'WARN',
                source: 'GEMINI_FALLBACK',
                action: 'SWITCH_MODEL',
                message: `Quota excedida en ${primaryModel}. Conmutando a ${DEFAULT_MODEL}.`,
                correlationId,
                tenantId
            });

            return await callGeminiRecursive(prompt, tenantId, {
                ...options,
                model: DEFAULT_MODEL
            }, session);
        }

        throw error;
    }
}

/**
 * Worker interno recursivo
 */
async function callGeminiRecursive(
    prompt: string,
    tenantId: string,
    options: { correlationId: string; temperature?: number; model?: string },
    session?: any
): Promise<string> {
    const config = await AiModelManager.getTenantAiConfig({ user: { tenantId } } as any);
    const { correlationId, temperature = 0.7, model: rawModel = config.defaultModel } = options;
    const modelName = mapModelName(rawModel);

    return tracer.startActiveSpan('gemini.generate_content', {
        attributes: {
            'tenant.id': tenantId,
            'correlation.id': correlationId,
            'genai.model': modelName,
            'genai.temperature': temperature
        }
    }, async (span) => {
        try {
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });
            const result = await executeWithResilience(
                'GEMINI_MINI',
                'GENERATE_CONTENT',
                () => model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: { temperature }
                }),
                correlationId,
                tenantId
            );

            const responseText = result.response.text();
            const usage = (result.response as any).usageMetadata;
            if (usage) {
                await UsageService.trackLLM(tenantId, usage.totalTokenCount, modelName, correlationId, session);
            }

            span.setStatus({ code: SpanStatusCode.OK });
            return responseText;
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
 * Genera contenido de forma atómica.
 */
export async function callGeminiMini(
    prompt: string,
    tenantId: string,
    options: { correlationId: string; temperature?: number; model?: string },
    session?: any
): Promise<string> {
    CallGeminiMiniSchema.parse({ prompt, tenantId, options: { ...options, correlationId: options.correlationId } });
    return callGeminiDynamic(prompt, tenantId, options, session);
}

/**
 * Genera contenido usando el modelo Pro.
 */
export async function callGeminiPro(
    prompt: string,
    tenantId: string,
    options: { correlationId: string; temperature?: number; model?: string; maxTokens?: number }
): Promise<string> {
    const config = await AiModelManager.getTenantAiConfig({ user: { tenantId } } as any);
    return callGemini(prompt, tenantId, options.correlationId, {
        ...options,
        model: options.model || config.defaultModel,
        maxTokens: options.maxTokens || 4096
    });
}

/**
 * Genera contenido de forma progresiva (Streaming)
 */
export async function callGeminiStream(
    prompt: string,
    tenantId: string,
    options: { correlationId: string; temperature?: number; model?: string }
) {
    const { correlationId, temperature = 0.7, model: rawModel = DEFAULT_MODEL } = options;
    const modelName = mapModelName(rawModel);

    return tracer.startActiveSpan('gemini.stream_content', {
        attributes: {
            'tenant.id': tenantId,
            'correlation.id': correlationId,
            'genai.model': modelName,
            'genai.temperature': temperature
        }
    }, async (span) => {
        try {
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });

            const result = await model.generateContentStream({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature }
            });

            span.setStatus({ code: SpanStatusCode.OK });

            const originalStream = result.stream;

            async function* wrappedStream() {
                let fullText = "";
                try {
                    for await (const chunk of originalStream) {
                        fullText += chunk.text();
                        yield chunk;
                    }

                    const response = await result.response;
                    const usage = (response as any).usageMetadata;

                    if (usage) {
                        await UsageService.trackLLM(tenantId, usage.totalTokenCount, modelName, correlationId);
                    }
                } catch (err: any) {
                    console.error("[STREAM WRAPPER ERROR]", err);
                    throw err;
                }
            }

            return wrappedStream();
        } catch (error: any) {
            span.recordException(error);
            console.error(`[AI STREAM ERROR]`, error.message);

            await logEvento({
                level: 'ERROR',
                source: 'GEMINI_STREAM',
                action: 'STREAM_ERROR',
                message: `Error en streaming Gemini: ${error.message}`,
                correlationId,
                tenantId,
                stack: error.stack
            });
            throw error;
        } finally {
            span.end();
        }
    });
}

/**
 * Proxies para servicios especializados (Mantener compatibilidad)
 */
export async function extractModelsWithGemini(text: string, tenantId: string, correlationId: string, session?: any) {
    const { ExtractionService } = await import("@/lib/extraction-service");
    return ExtractionService.extractModelsWithGemini(text, tenantId, correlationId, session);
}

export async function analyzeEntityWithGemini(entitySlug: string, text: string, tenantId: string, correlationId: string) {
    const { AdaptiveAnalysisService } = await import("@/lib/adaptive-analysis-service");
    return AdaptiveAnalysisService.analyzeEntityWithGemini(entitySlug, text, tenantId, correlationId);
}

export async function analyzePDFVisuals(pdfBuffer: Buffer, tenantId: string, correlationId: string, session?: any) {
    const { VisionService } = await import("@/lib/vision-service");
    return VisionService.analyzePDFVisuals(pdfBuffer, tenantId, correlationId, session);
}

/**
 * Estructura de respuesta extendida para IA
 */
export interface GeminiResponse {
    text: string;
    usage?: {
        input: number;
        output: number;
        total: number;
    };
}

/**
 * Llamada genérica a Gemini para generación de texto con metadata de uso.
 */
export async function callGeminiExtended(
    prompt: string,
    tenantId: string,
    correlationId: string,
    options?: {
        temperature?: number;
        maxTokens?: number;
        model?: string;
    }
): Promise<GeminiResponse> {
    const start = Date.now();
    const modelName = mapModelName(options?.model || DEFAULT_MODEL);

    return tracer.startActiveSpan('gemini.text_generation', {
        attributes: {
            'tenant.id': tenantId,
            'correlation.id': correlationId,
            'genai.model': modelName,
            'genai.temperature': options?.temperature ?? 0.7
        }
    }, async (span) => {
        try {
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    temperature: options?.temperature ?? 0.7,
                    maxOutputTokens: options?.maxTokens ?? 2048,
                }
            }, { apiVersion: 'v1beta' });

            const result = await executeWithResilience(
                'GEMINI_CALL',
                'GENERATE_CONTENT',
                () => model.generateContent(prompt),
                correlationId,
                tenantId
            );
            const text = result.response.text();

            const duration = Date.now() - start;
            span.setAttribute('genai.duration_ms', duration);

            let usageData: GeminiResponse['usage'] = undefined;
            const usage = (result.response as any).usageMetadata;
            if (usage) {
                span.setAttribute('genai.tokens', usage.totalTokenCount);
                usageData = {
                    input: usage.promptTokenCount,
                    output: usage.candidatesTokenCount,
                    total: usage.totalTokenCount
                };
                await UsageService.trackLLM(tenantId, usage.totalTokenCount, modelName, correlationId);
            }

            span.setStatus({ code: SpanStatusCode.OK });
            return { text, usage: usageData };
        } catch (error) {
            span.recordException(error as Error);
            span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
            throw new ExternalServiceError(`Gemini API Error: ${(error as Error).message}`, error as Error);
        } finally {
            span.end();
        }
    });
}

/**
 * Llamada genérica a Gemini (Backward compatible)
 */
export async function callGemini(
    prompt: string,
    tenantId: string,
    correlationId: string,
    options?: {
        temperature?: number;
        maxTokens?: number;
        model?: string;
    }
): Promise<string> {
    const response = await callGeminiExtended(prompt, tenantId, correlationId, options);
    return response.text;
}
