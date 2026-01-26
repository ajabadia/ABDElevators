import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from "zod";
import { ExternalServiceError, AppError } from './errors';
import { logEvento } from './logger';
import { UsageService } from './usage-service';

import { PromptService } from './prompt-service';

let genAIInstance: GoogleGenerativeAI | null = null;

function getGenAI() {
    if (!genAIInstance) {
        if (!process.env.GEMINI_API_KEY) {
            throw new ExternalServiceError('GEMINI_API_KEY is not defined in environment');
        }
        genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAIInstance;
}

const GenerateEmbeddingSchema = z.object({
    text: z.string().min(1),
    correlacion_id: z.string()
});

/**
 * Genera embeddings ...
 */
export async function generateEmbedding(text: string, tenantId: string, correlacion_id: string): Promise<number[]> {
    GenerateEmbeddingSchema.parse({ text, correlacion_id });
    const start = Date.now();
    try {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);

        const duration = Date.now() - start;
        if (duration > 1000) {
            await logEvento({
                nivel: 'WARN',
                origen: 'GEMINI_EMBEDDING',
                accion: 'SLA_VIOLATION',
                mensaje: `Embedding lento: ${duration}ms`,
                correlacion_id,
                detalles: { duration_ms: duration, text_length: text.length }
            });
        }

        // Tracking de uso de AI (Aproximación para embeddings: 1 request = 1 unidad o tokens estimados)
        await UsageService.trackLLM(tenantId, text.length / 4, 'text-embedding-004', correlacion_id);

        return result.embedding.values;
    } catch (error) {
        await logEvento({
            nivel: 'ERROR',
            origen: 'GEMINI_EMBEDDING',
            accion: 'EMBED_ERROR',
            mensaje: `Fallo en embedding Gemini: ${(error as Error).message}`,
            correlacion_id,
            stack: (error as Error).stack
        });
        throw new ExternalServiceError('Error generating embedding with Gemini', error as Error);
    }
}

const CallGeminiMiniSchema = z.object({
    prompt: z.string().min(1),
    tenantId: z.string(),
    options: z.object({
        correlacion_id: z.string().uuid(),
        temperature: z.number().min(0).max(1).optional()
    })
});

export async function callGeminiMini(
    prompt: string,
    tenantId: string,
    options: { correlacion_id: string; temperature?: number }
): Promise<string> {
    CallGeminiMiniSchema.parse({ prompt, tenantId, options });
    const { correlacion_id, temperature = 0.7 } = options;
    const start = Date.now();

    try {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature }
        });

        const responseText = result.response.text();
        const duration = Date.now() - start;

        // Tracking de uso (Tokens reales)
        const usage = (result.response as any).usageMetadata;
        if (usage) {
            await UsageService.trackLLM(tenantId, usage.totalTokenCount, 'gemini-2.0-flash', correlacion_id);
        }

        return responseText;
    } catch (error) {
        const errorDetails = {
            message: (error as Error).message,
            stack: (error as Error).stack,
            cause: (error as any).cause
        };

        await logEvento({
            nivel: 'ERROR',
            origen: 'GEMINI_MINI',
            accion: 'CALL_ERROR',
            mensaje: `Error en Gemini Mini: ${(error as Error).message}`,
            correlacion_id,
            stack: (error as Error).stack,
            detalles: errorDetails
        });
        throw new AppError('EXTERNAL_SERVICE_ERROR', 500, 'Error in Gemini Mini call', errorDetails);
    }
}

const ExtractModelsSchema = z.object({
    text: z.string().min(1),
    correlacion_id: z.string()
});

const ExtractedModelsArraySchema = z.array(z.object({
    tipo: z.enum(["botonera", "motor", "cuadro", "puerta", "otros"]),
    modelo: z.string()
}));

/**
 * Extrae modelos ...
 */
export async function extractModelsWithGemini(text: string, tenantId: string, correlacion_id: string) {
    ExtractModelsSchema.parse({ text, correlacion_id });
    const start = Date.now();
    try {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Renderizar el prompt dinámico
        const renderedPrompt = await PromptService.renderPrompt(
            'MODEL_EXTRACTOR',
            { text },
            tenantId
        );

        const result = await model.generateContent(renderedPrompt);
        const responseText = result.response.text();
        const duration = Date.now() - start;

        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new ExternalServiceError('No valid JSON found in Gemini response');
        }

        let modelos;
        try {
            modelos = JSON.parse(jsonMatch[0]);
            // Zod validation for the parsed JSON
            ExtractedModelsArraySchema.parse(modelos);
        } catch (parseError) {
            throw new ExternalServiceError('Failed to parse or validate Gemini response as expected JSON array', parseError as Error);
        }

        // Tracking de uso (Tokens reales)
        const usage = (result.response as any).usageMetadata;
        if (usage) {
            await UsageService.trackLLM(tenantId, usage.totalTokenCount, 'gemini-2.0-flash', correlacion_id);
        }

        return modelos;
    } catch (error) {
        await logEvento({
            nivel: 'ERROR',
            origen: 'GEMINI_EXTRACTION',
            accion: 'EXTRACT_ERROR',
            mensaje: `Fallo en extracción Gemini: ${(error as Error).message}`,
            correlacion_id,
            stack: (error as Error).stack
        });
        throw new ExternalServiceError('Error extracting models with Gemini', error as Error);
    }
}

/**
 * Llamada genérica a Gemini para generación de texto
 * Útil para informes, resúmenes, etc.
 */
export async function callGemini(
    prompt: string,
    tenantId: string,
    correlacion_id: string,
    options?: {
        temperature?: number;
        maxTokens?: number;
        model?: string;
    }
): Promise<string> {
    const start = Date.now();
    try {
        const genAI = getGenAI();
        const modelName = options?.model || 'gemini-2.0-flash-exp';
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                temperature: options?.temperature ?? 0.7,
                maxOutputTokens: options?.maxTokens ?? 2048,
            }
        });

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        const duration = Date.now() - start;

        // Tracking de uso
        const usage = (response as any).usageMetadata;
        if (usage) {
            await UsageService.trackLLM(tenantId, usage.totalTokenCount, modelName, correlacion_id);
        }

        await logEvento({
            nivel: 'INFO',
            origen: 'GEMINI_GENERATION',
            accion: 'TEXT_GENERATED',
            mensaje: `Texto generado con ${modelName}`,
            correlacion_id,
            detalles: {
                duration_ms: duration,
                tokens: usage?.totalTokenCount,
                promptLength: prompt.length,
                responseLength: text.length
            }
        });

        return text;
    } catch (error) {
        await logEvento({
            nivel: 'ERROR',
            origen: 'GEMINI_GENERATION',
            accion: 'GENERATION_ERROR',
            mensaje: `Error en generación: ${(error as Error).message}`,
            correlacion_id,
            stack: (error as Error).stack
        });
        throw new ExternalServiceError('Error generating text with Gemini', error as Error);
    }
}
