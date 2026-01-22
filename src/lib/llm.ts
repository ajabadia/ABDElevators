import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from "zod";
import { ExternalServiceError, AppError } from './errors';
import { logEvento } from './logger';
import { UsageService } from './usage-service';

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
        await logEvento({
            nivel: 'ERROR',
            origen: 'GEMINI_MINI',
            accion: 'CALL_ERROR',
            mensaje: `Error en Gemini Mini: ${(error as Error).message}`,
            correlacion_id,
            stack: (error as Error).stack
        });
        throw new AppError('EXTERNAL_SERVICE_ERROR', 500, 'Error in Gemini Mini call');
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
        const prompt = `Analiza este documento de pedido de ascensores y extrae una lista JSON con todos los modelos de componentes mencionados. 
    Formato: [{ "tipo": "botonera" | "motor" | "cuadro" | "puerta" | "otros", "modelo": "CÓDIGO" }]. 
    Solo devuelve el JSON, sin explicaciones.
    
    TEXTO:
    ${text}`;

        const result = await model.generateContent(prompt);
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
