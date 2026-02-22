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

import { DEFAULT_MODEL, AI_MODEL_IDS } from './constants/ai-models';

/**
 * Mapea nombres de modelos comerciales o técnicos a nombres oficiales de la SDK.
 * Actualizado para permitir modelos 1.5 y 2.0 sin fallbacks forzados (Phase 172).
 */
export function mapModelName(model: string): string {
    const m = model.toLowerCase();

    // ⚡ Alineación Estricta Contrato (Phase 207)
    if (m.includes(AI_MODEL_IDS.GEMINI_1_5_FLASH)) return AI_MODEL_IDS.GEMINI_1_5_FLASH;
    if (m.includes(AI_MODEL_IDS.GEMINI_1_5_PRO)) return AI_MODEL_IDS.GEMINI_1_5_PRO;
    if (m.includes(AI_MODEL_IDS.GEMINI_2_0_FLASH)) return AI_MODEL_IDS.GEMINI_2_0_FLASH;
    if (m.includes(AI_MODEL_IDS.GEMINI_2_5_FLASH)) return AI_MODEL_IDS.GEMINI_2_5_FLASH;
    if (m.includes(AI_MODEL_IDS.GEMINI_2_5_PRO)) return AI_MODEL_IDS.GEMINI_2_5_PRO;
    if (m.includes(AI_MODEL_IDS.GEMINI_3_PRO_PREVIEW)) return AI_MODEL_IDS.GEMINI_3_PRO_PREVIEW;

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
        const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });

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
