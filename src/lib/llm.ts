import { z } from "zod";
import { ExternalServiceError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { UsageService } from './usage-service';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { executeWithResilience } from './resilience';
import { getGenAI, mapModelName, runShadowCall } from "./gemini-client";

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
        correlationId: z.string().uuid(),
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
            'genai.model': "text-embedding-004",
            'genai.text_length': text.length
        }
    }, async (span) => {
        try {
            GenerateEmbeddingSchema.parse({ text, correlationId });
            const start = Date.now();

            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

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

            await UsageService.trackLLM(tenantId, text.length / 4, 'text-embedding-004', correlationId, session);

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
                stack: (error as Error).stack
            });
            throw new ExternalServiceError('Error generating embedding with Gemini', error as Error);
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
    const { correlationId, temperature = 0.7, model: rawModel = 'gemini-1.5-flash' } = options;
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
            CallGeminiMiniSchema.parse({ prompt, tenantId, options: { ...options, correlationId } });
            const start = Date.now();

            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({ model: modelName });
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
            const duration = Date.now() - start;
            span.setAttribute('genai.duration_ms', duration);

            const usage = (result.response as any).usageMetadata;
            if (usage) {
                span.setAttribute('genai.tokens', usage.totalTokenCount);
                await UsageService.trackLLM(tenantId, usage.totalTokenCount, modelName, correlationId, session);
            }

            span.setStatus({ code: SpanStatusCode.OK });
            return responseText;
        } catch (error: any) {
            span.recordException(error);
            span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            console.error(`[AI ERROR] Gemini Failure in ${modelName}:`, error.message);

            await logEvento({
                level: 'ERROR',
                source: 'GEMINI_MINI',
                action: 'CALL_ERROR',
                message: `Error en Gemini Mini (${modelName}): ${error.message}`,
                correlationId,
                stack: error.stack
            });

            throw error;
        } finally {
            span.end();
        }
    });
}

/**
 * Genera contenido usando el modelo Pro (Gemini 1.5 Pro).
 */
export async function callGeminiPro(
    prompt: string,
    tenantId: string,
    options: { correlationId: string; temperature?: number; model?: string }
): Promise<string> {
    return callGemini(prompt, tenantId, options.correlationId, {
        ...options,
        model: options.model || 'gemini-1.5-pro'
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
    const { correlationId, temperature = 0.7, model: rawModel = 'gemini-1.5-flash' } = options;
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
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContentStream({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature }
            });

            span.setStatus({ code: SpanStatusCode.OK });
            return result.stream;
        } catch (error: any) {
            span.recordException(error);
            console.error(`[AI STREAM ERROR]`, error.message);
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
    const { ExtractionService } = await import("./extraction-service");
    return ExtractionService.extractModelsWithGemini(text, tenantId, correlationId, session);
}

export async function analyzeEntityWithGemini(entitySlug: string, text: string, tenantId: string, correlationId: string) {
    const { AdaptiveAnalysisService } = await import("./adaptive-analysis-service");
    return AdaptiveAnalysisService.analyzeEntityWithGemini(entitySlug, text, tenantId, correlationId);
}

export async function analyzePDFVisuals(pdfBuffer: Buffer, tenantId: string, correlationId: string, session?: any) {
    const { VisionService } = await import("./vision-service");
    return VisionService.analyzePDFVisuals(pdfBuffer, tenantId, correlationId, session);
}

/**
 * Llamada genérica a Gemini para generación de texto
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
    const start = Date.now();
    const modelName = mapModelName(options?.model || 'gemini-1.5-flash');

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
            });

            const result = await model.generateContent(prompt);
            const text = result.response.text();

            const duration = Date.now() - start;
            span.setAttribute('genai.duration_ms', duration);

            const usage = (result.response as any).usageMetadata;
            if (usage) {
                span.setAttribute('genai.tokens', usage.totalTokenCount);
                await UsageService.trackLLM(tenantId, usage.totalTokenCount, modelName, correlationId);
            }

            span.setStatus({ code: SpanStatusCode.OK });
            return text;
        } catch (error) {
            span.recordException(error as Error);
            span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
            throw new ExternalServiceError('Error generating text with Gemini', error as Error);
        } finally {
            span.end();
        }
    });
}
