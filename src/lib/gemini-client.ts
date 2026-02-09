import { GoogleGenerativeAI } from '@google/generative-ai';
import { ExternalServiceError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { UsageService } from './usage-service';

let genAIInstance: GoogleGenerativeAI | null = null;

/**
 * Obtiene la instancia singleton de GoogleGenerativeAI.
 */
export function getGenAI() {
    if (!genAIInstance) {
        if (!process.env.GEMINI_API_KEY) {
            throw new ExternalServiceError('GEMINI_API_KEY is not defined in environment');
        }
        genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAIInstance;
}

/**
 * Mapea nombres de modelos comerciales o técnicos a nombres oficiales de la SDK.
 */
export function mapModelName(model: string): string {
    const m = model.toLowerCase();

    // Soporte para Gemini 2.x/3.x (requested by user)
    // Nota: Mapeamos a las versiones estables más recientes si el alias no es directo.
    if (m.includes('gemini-2.5') || m.includes('gemini-3')) {
        return 'gemini-2.0-flash'; // O la versión pro si se prefiere, pero flash es el default para RAG
    }

    if (m.includes('gemini-2.0')) return 'gemini-2.0-flash';
    if (m.includes('pro')) return 'gemini-1.5-pro';
    if (m.includes('flash')) return 'gemini-1.5-flash';
    return 'gemini-1.5-flash'; // Fallback seguro
}

/**
 * Ejecuta una llamada sombra al LLM en segundo plano (Fase 36).
 */
export async function runShadowCall(
    prompt: string,
    modelName: string,
    tenantId: string,
    correlationId: string,
    originalKey: string,
    shadowKey: string
) {
    try {
        const start = Date.now();
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent(prompt);
        const duration = Date.now() - start;
        const responseText = result.response.text();

        const usage = (result.response as any).usageMetadata;
        if (usage) {
            await UsageService.trackShadowLLM(tenantId, usage.totalTokenCount, modelName, correlationId);
        }

        await logEvento({
            level: 'INFO',
            source: 'GEMINI_SHADOW',
            action: 'SHADOW_EXECUTION',
            message: `Ejecución sombra para "${originalKey}" usando "${shadowKey}" en ${duration}ms`,
            correlationId,
            tenantId,
            details: {
                originalKey,
                shadowKey,
                model: modelName,
                durationMs: duration,
                responsePreview: responseText.substring(0, 200) + '...'
            }
        });

    } catch (err: any) {
        await logEvento({
            level: 'WARN',
            source: 'GEMINI_SHADOW',
            action: 'SHADOW_ERROR',
            message: `Fallo en ejecución sombra ${shadowKey}: ${err.message}`,
            correlationId,
            tenantId,
            details: { shadowKey, originalKey }
        });
    }
}
