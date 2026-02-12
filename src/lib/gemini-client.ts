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

    // Soporte para Gemini 3 (Working models per user feedback)
    if (m.includes('gemini-3')) {
        if (m.includes('image')) return 'gemini-3-pro-image';
        if (m.includes('preview')) return 'gemini-3-pro-preview';
        return 'gemini-3-pro';
    }

    // Soporte para Gemini 2.5 (Working models per documentation)
    if (m.includes('gemini-2.5')) {
        return 'gemini-2.5-flash';
    }

    // Fallback estable prioritario según Documentación/MODELOS_DISPONIBLES.md
    return 'gemini-2.5-flash';
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
