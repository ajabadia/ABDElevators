import { GoogleGenerativeAI } from '@google/generative-ai';
import { ExternalServiceError } from './errors';
import { logEvento } from './logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Genera embeddings para un fragmento de texto usando text-embedding-004.
 * SLA: P95 < 1000ms
 */
export async function generateEmbedding(text: string, correlacion_id: string): Promise<number[]> {
    const start = Date.now();
    try {
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent(text);
        const duration = Date.now() - start;

        // Regla #8: Medir performance y loguear si excede SLA
        if (duration > 1500) { // Tolerancia extra para red
            await logEvento({
                nivel: 'WARN',
                origen: 'GEMINI_EMBEDDING',
                accion: 'SLA_VIOLATION',
                mensaje: `Embeddings generados pero excedió SLA: ${duration}ms`,
                correlacion_id,
                detalles: { duration_ms: duration }
            });
        }

        return result.embedding.values;
    } catch (error: any) {
        await logEvento({
            nivel: 'ERROR',
            origen: 'GEMINI_EMBEDDING',
            accion: 'GENERATE_ERROR',
            mensaje: `Fallo al generar embedding: ${error.message}`,
            correlacion_id,
            stack: error.stack
        });
        throw new ExternalServiceError('Error generatig embedding with Gemini', error);
    }
}

/**
 * Extrae modelos de componentes de un texto usando Gemini 2.0 Flash.
 * SLA: P95 < 3000ms
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

        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in Gemini response');
        }

        const modelos = JSON.parse(jsonMatch[0]);

        await logEvento({
            nivel: 'DEBUG',
            origen: 'GEMINI_EXTRACTION',
            accion: 'EXTRACT_SUCCESS',
            mensaje: `Modelos extraídos correctamente en ${duration}ms`,
            correlacion_id,
            detalles: { modelos_count: modelos.length, duration_ms: duration }
        });

        if (duration > 5000) {
            await logEvento({
                nivel: 'WARN',
                origen: 'GEMINI_EXTRACTION',
                accion: 'SLA_VIOLATION',
                mensaje: `Extracción completada pero excedió SLA: ${duration}ms`,
                correlacion_id,
                detalles: { duration_ms: duration }
            });
        }

        return modelos;
    } catch (error: any) {
        await logEvento({
            nivel: 'ERROR',
            origen: 'GEMINI_EXTRACTION',
            accion: 'EXTRACT_ERROR',
            mensaje: `Fallo en extracción Gemini: ${error.message}`,
            correlacion_id,
            stack: error.stack
        });
        throw new ExternalServiceError('Error extracting models with Gemini', error);
    }
}
