import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from "zod";
import { ExternalServiceError, AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { UsageService } from './usage-service';
import { PromptService } from './prompt-service';
import { EntityEngine } from '@/core/engine/EntityEngine';
import { AgentEngine } from '@/core/engine/AgentEngine';

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
 * Mapea nombres de modelos legacy/incorrectos a modelos oficiales de Google.
 */
function mapModelName(model: string): string {
    if (model.startsWith('gemini-3')) {
        // Redirigir gemini-3 a gemini-2.0-flash-exp (Experimental) o gemini-1.5-pro
        return 'gemini-1.5-flash';
    }
    return model;
}

/**
 * Genera embeddings ...
 */
export async function generateEmbedding(text: string, tenantId: string, correlationId: string): Promise<number[]> {
    GenerateEmbeddingSchema.parse({ text, correlationId });
    const start = Date.now();
    try {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);

        const duration = Date.now() - start;
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

        // Tracking de uso de AI (Aproximación para embeddings: 1 request = 1 unidad o tokens estimados)
        await UsageService.trackLLM(tenantId, text.length / 4, 'text-embedding-004', correlationId);

        return result.embedding.values;
    } catch (error) {
        await logEvento({
            level: 'ERROR',
            source: 'GEMINI_EMBEDDING',
            action: 'EMBED_ERROR',
            message: `Fallo en embedding Gemini: ${(error as Error).message}`,
            correlationId,
            stack: (error as Error).stack
        });
        throw new ExternalServiceError('Error generating embedding with Gemini', error as Error);
    }
}


export async function callGeminiMini(
    prompt: string,
    tenantId: string,
    options: { correlationId: string; temperature?: number; model?: string }
): Promise<string> {
    CallGeminiMiniSchema.parse({ prompt, tenantId, options: { ...options, correlationId: options.correlationId } });
    const { correlationId, temperature = 0.7, model: rawModel = 'gemini-1.5-flash' } = options;
    const modelName = mapModelName(rawModel);
    const start = Date.now();

    try {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature }
        });

        const responseText = result.response.text();
        const duration = Date.now() - start;

        // Tracking de uso (Tokens reales)
        const usage = (result.response as any).usageMetadata;
        if (usage) {
            await UsageService.trackLLM(tenantId, usage.totalTokenCount, modelName, correlationId);
        }

        return responseText;
    } catch (error: any) {
        const rawMessage = error.message || 'Sin mensaje de error';
        const errorDetails = {
            geminiMessage: rawMessage,
            geminiStack: error.stack,
            geminiCause: error.cause,
            modelRequested: modelName,
            tenantId
        };

        // Regla #4: Logging Estructurado (Hacia terminal para visibilidad inmediata en dev)
        console.error(`[AI ERROR] Gemini Failure in ${modelName}:`, rawMessage);

        await logEvento({
            level: 'ERROR',
            source: 'GEMINI_MINI',
            action: 'CALL_ERROR',
            message: `Error en Gemini Mini (${modelName}): ${rawMessage}`,
            correlationId,
            stack: error.stack,
            details: errorDetails
        });

        throw new AppError(
            'EXTERNAL_SERVICE_ERROR',
            500,
            `Error en llamada a Gemini (${modelName}): ${rawMessage}`,
            errorDetails
        );
    }
}

const ExtractModelsSchema = z.object({
    text: z.string().min(1),
    correlationId: z.string()
});

const ExtractedModelsArraySchema = z.array(z.object({
    type: z.string(),
    model: z.string()
}));

/**
 * Extrae modelos ...
 */
export async function extractModelsWithGemini(text: string, tenantId: string, correlationId: string) {
    ExtractModelsSchema.parse({ text, correlationId });
    const start = Date.now();
    try {
        const genAI = getGenAI();

        // Renderizar el prompt dinámico y obtener el modelo configurado
        const { text: renderedPrompt, model: modelName } = await PromptService.getRenderedPrompt(
            'MODEL_EXTRACTOR',
            { text },
            tenantId
        );

        const model = genAI.getGenerativeModel({ model: modelName });
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
            await UsageService.trackLLM(tenantId, usage.totalTokenCount, modelName, correlationId);
        }

        return modelos;
    } catch (error) {
        const errorDetails = {
            message: (error as Error).message,
            stack: (error as Error).stack
        };
        await logEvento({
            level: 'ERROR',
            source: 'GEMINI_EXTRACTION',
            action: 'EXTRACT_ERROR',
            message: `Fallo en extracción Gemini: ${(error as Error).message}`,
            correlationId,
            stack: (error as Error).stack,
            details: errorDetails
        });
        throw new ExternalServiceError('Error extracting models with Gemini', errorDetails);
    }
}

/**
 * Analiza una entidad usando prompts adaptativos de la ontología. (Fase KIMI 5)
 */
export async function analyzeEntityWithGemini(
    entitySlug: string,
    text: string,
    tenantId: string,
    correlationId: string
) {
    const start = Date.now();
    try {
        const engine = EntityEngine.getInstance();
        const agent = AgentEngine.getInstance();

        let renderedPrompt = engine.renderPrompt(entitySlug, 'analyze', { text });
        let modelName = 'gemini-1.5-flash';

        // Inyectar aprendizaje del contexto del agente (Feedback Loop)
        const learningContext = await agent.getCorrectionContext(entitySlug, tenantId);
        if (learningContext) {
            renderedPrompt += learningContext;
        }

        // Si la ontología no tiene prompt, caer en el PromptService (Legacy/DB)
        if (!renderedPrompt) {
            const result = await PromptService.getRenderedPrompt('MODEL_EXTRACTOR', { text }, tenantId);
            renderedPrompt = result.text;
            modelName = result.model;
        }

        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(renderedPrompt);
        const responseText = result.response.text();

        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new ExternalServiceError('No hay JSON válido en la respuesta de Gemini');
        }

        let resultData;
        try {
            resultData = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            throw new ExternalServiceError('Fallo al parsear JSON adaptativo', parseError as Error);
        }

        // Tracking de uso
        const usage = (result.response as any).usageMetadata;
        if (usage) {
            await UsageService.trackLLM(tenantId, usage.totalTokenCount, modelName, correlationId);
        }

        return resultData;
    } catch (error: any) {
        await logEvento({
            level: 'ERROR',
            source: 'GEMINI_ADAPTIVE_ANALYSIS',
            action: 'ANALYSIS_ERROR',
            message: `Error analizando ${entitySlug}: ${error.message}`,
            correlationId,
            details: { entitySlug }
        });
        throw error;
    }
}

/**
 * Llamada genérica a Gemini para generación de texto
 * Útil para informes, resúmenes, etc.
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
    try {
        const genAI = getGenAI();
        const rawModel = options?.model || 'gemini-2.5-flash';
        const modelName = mapModelName(rawModel);
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
            await UsageService.trackLLM(tenantId, usage.totalTokenCount, modelName, correlationId);
        }

        await logEvento({
            level: 'INFO',
            source: 'GEMINI_GENERATION',
            action: 'TEXT_GENERATED',
            message: `Texto generado con ${modelName}`,
            correlationId,
            details: {
                durationMs: duration,
                tokens: usage?.totalTokenCount,
                promptLength: prompt.length,
                responseLength: text.length
            }
        });

        return text;
    } catch (error) {
        await logEvento({
            level: 'ERROR',
            source: 'GEMINI_GENERATION',
            action: 'GENERATION_ERROR',
            message: `Error en generación: ${(error as Error).message}`,
            correlationId,
            stack: (error as Error).stack
        });
        throw new ExternalServiceError('Error generating text with Gemini', error as Error);
    }
}
