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

import { DEFAULT_MODEL } from './constants/ai-models';

/**
 * Mapea nombres de modelos comerciales o técnicos a nombres oficiales de la SDK.
 * Actualizado para permitir modelos 1.5 y 2.0 sin fallbacks forzados (Phase 172).
 */
export function mapModelName(model: string): string {
    const m = model.toLowerCase();

    // Soporte explícito para modelos conocidos del registro único
    if (m.includes('gemini-1.5-pro')) return 'gemini-1.5-pro';
    if (m.includes('gemini-1.5-flash')) return 'gemini-1.5-flash';
    if (m.includes('gemini-2.0-flash')) return 'gemini-2.0-flash';
    if (m.includes('gemini-2.5-pro')) return 'gemini-2.5-flash'; // Temporalmente mapeamos 2.5 pro a flash si no hay instancia pro
    if (m.includes('gemini-2.5-flash')) return 'gemini-2.5-flash';
    if (m.includes('flash-latest')) return 'gemini-1.5-flash'; // Mapeo a versión estable según disponibilidad de API
    if (m.includes('pro-latest')) return 'gemini-1.5-pro';

    if (m.includes('gemini-3')) {
        if (m.includes('image')) return 'gemini-3-pro-image';
        return 'gemini-3-pro';
    }

    // Fallback a modelo por defecto si no se reconoce
    return DEFAULT_MODEL;
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
