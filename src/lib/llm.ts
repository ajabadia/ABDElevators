import { GoogleGenerativeAI } from '@google/generative-ai';
import { ExternalServiceError } from './errors';
import { logEvento } from './logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Genera embeddings para un fragmento de texto usando text-embedding-004.
 * Regla de Oro #8: Medir performance.
 */
export async function generateEmbedding(text: string, correlacion_id: string): Promise<number[]> {
    const start = Date.now();
    try {
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent(text);
        const duration = Date.now() - start;

        if (duration > 1000) {
            await logEvento({
                nivel: 'WARN',
                origen: 'GEMINI_EMBEDDING',
                accion: 'GENERATE',
                mensaje: `Embedding generation took ${duration}ms`,
                correlacion_id,
                detalles: { duration_ms: duration }
            });
        }

        return result.embedding.values;
    } catch (error) {
        await logEvento({
            nivel: 'ERROR',
            origen: 'GEMINI_EMBEDDING',
            accion: 'GENERATE',
            mensaje: 'Failed to generate embedding',
            correlacion_id,
            stack: error instanceof Error ? error.stack : String(error)
        });
        throw new ExternalServiceError('Error generating embedding with Gemini', error);
    }
}

/**
 * Extrae modelos de componentes de un texto usando Gemini 2.0 Flash.
 * Regla de Oro #3: AppError.
 */
export async function extractModelsWithGemini(text: string, correlacion_id: string) {
    const start = Date.now();
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `Analiza este documento de pedido de ascensores y extrae una lista JSON con todos los modelos de componentes mencionados. 
    Formato: [{ "tipo": "botonera" | "motor" | "cuadro" | "puerta" | "otros", "modelo": "CÓDIGO" }]. 
    Solo devuelve el JSON, sin explicaciones.
    
    TEXTO:
    ${text}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const duration = Date.now() - start;

        // Limpiar respuesta Gemini (a veces incluye bloques de código markdown)
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in Gemini response');
        }

        const modelos = JSON.parse(jsonMatch[0]);

        await logEvento({
            nivel: 'INFO',
            origen: 'GEMINI_EXTRACTION',
            accion: 'EXTRACT',
            mensaje: `Models extracted in ${duration}ms`,
            correlacion_id,
            detalles: { modelos, duration_ms: duration }
        });

        return modelos;
    } catch (error) {
        await logEvento({
            nivel: 'ERROR',
            origen: 'GEMINI_EXTRACTION',
            accion: 'EXTRACT',
            mensaje: 'Failed to extract models with Gemini',
            correlacion_id,
            stack: error instanceof Error ? error.stack : String(error)
        });
        throw new ExternalServiceError('Error extracting models with Gemini', error);
    }
}
