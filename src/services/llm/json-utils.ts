
import { logEvento } from '@/lib/logger';

/**
 * 🧹 LLM JSON Cleaner Utility
 * Proposito: Limpiar y normalizar respuestas JSON provenientes de LLMs antes de parsearlas.
 */
export class LlmJsonUtils {
    /**
     * Limpia un string sucio de LLM (quita markdown fences, quita comas finales, balances llaves).
     */
    static cleanJsonFromLLM(str: string): string {
        if (!str) return '';

        let clean = str.replace(/```json|```/g, '').trim();
        clean = clean.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

        const openBraces = (clean.match(/{/g) || []).length;
        const closeBraces = (clean.match(/}/g) || []).length;
        if (openBraces > closeBraces) {
            clean += '}'.repeat(openBraces - closeBraces);
        }

        const openBrackets = (clean.match(/\[/g) || []).length;
        const closeBrackets = (clean.match(/]/g) || []).length;
        if (openBrackets > closeBrackets) {
            clean += ']'.repeat(openBrackets - closeBrackets);
        }

        const quoteCount = (clean.match(/"/g) || []).length;
        const isEscaped = clean.endsWith('\\"');
        if (quoteCount % 2 !== 0 && !isEscaped) {
            clean += '"';
        }

        return clean;
    }

    /**
     * Intenta parsear un JSON de LLM de forma segura.
     */
    static safeParseLLMJson<T>(raw: string, correlationId?: string): T | null {
        try {
            const clean = this.cleanJsonFromLLM(raw);
            return JSON.parse(clean) as T;
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('[LLM-JSON-UTILS] ❌ Failed to parse JSON:', err.message);
            if (correlationId) {
                // RULE #4: await logEvento
                logEvento({
                    level: 'ERROR',
                    source: 'LLM_JSON_UTILS',
                    action: 'PARSE_FAILURE',
                    message: `Fallo al parsear JSON del LLM: ${err.message}`,
                    correlationId,
                    details: { raw: raw.substring(0, 500), error: err.message }
                }).catch(() => { });
            }
            return null;
        }
    }
}
