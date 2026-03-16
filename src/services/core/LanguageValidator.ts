import { ValidationError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';

/**
 * Whitelist de idiomas soportados (ISO 639-1).
 * Fase 165.3: RAG Ingestion Hardening
 */
export const SUPPORTED_LANGUAGES = ['es', 'en', 'fr', 'de', 'pt', 'it', 'ca'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

/**
 * Valida un código de idioma contra la whitelist.
 */
export function validateLanguageCode(code: string | undefined | null): SupportedLanguage {
    if (!code) return 'es'; // Default fallback

    const normalized = code.toLowerCase().trim().substring(0, 2);

    if (SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage)) {
        return normalized as SupportedLanguage;
    }

    // Si no es soportado, devolvemos 'es' pero logueamos el aviso
    logEvento({
        level: 'WARN',
        source: 'LANGUAGE_VALIDATOR',
        action: 'INVALID_LANGUAGE_DETECTED',
        message: `Código de idioma no soportado detectado: ${code}. Fallback a 'es'.`,
        details: { originalCode: code }
    }).catch(() => { }); // Fire and forget logging

    return 'es';
}

/**
 * 🕵️ Diccionario de stop-words por idioma para detección ligera (Sin LLM).
 */
const LANGUAGE_STOP_WORDS: Record<SupportedLanguage, string[]> = {
    es: ['y', 'con', 'por', 'para', 'los', 'las', 'un', 'una', 'del', 'al', 'su', 'este', 'pero'],
    en: ['the', 'and', 'of', 'to', 'in', 'is', 'that', 'it', 'on', 'with', 'for', 'was', 'as', 'be'],
    pt: ['o', 'os', 'as', 'um', 'uma', 'e', 'em', 'com', 'pelo', 'pela', 'do', 'da', 'no', 'na', 'é'],
    de: ['der', 'die', 'das', 'und', 'ist', 'mit', 'von', 'im', 'fuer', 'ein', 'eine', 'den', 'dem', 'zu'],
    fr: ['les', 'du', 'des', 'et', 'est', 'dans', 'en', 'un', 'une', 'pour', 'sur'],
    it: ['il', 'lo', 'i', 'gli', 'ed', 'che', 'per', 'un', 'una', 'del', 'al'],
    ca: ['els', 'les', 'més', 'amb', 'pel', 'pels', 'és', 'però', 'també', 'fins', 'tot', 'on']
};

/**
 * Detecta el idioma de un texto basándose en la frecuencia de keywords comunes.
 * Optimizado para velocidad (Fase 165.3).
 */
export async function detectAndValidateLanguage(text: string): Promise<SupportedLanguage> {
    if (!text || text.length < 20) return 'es';

    const sample = text.toLowerCase().substring(0, 5000); // Muestra suficiente para estadística
    const words = sample.split(/\P{L}+/u); // Divide por no-letras (Unicode)
    
    const scores: Record<string, number> = {};
    SUPPORTED_LANGUAGES.forEach(lang => scores[lang] = 0);

    for (const word of words) {
        if (word.length < 2) continue;
        for (const lang of SUPPORTED_LANGUAGES) {
            if (LANGUAGE_STOP_WORDS[lang].includes(word)) {
                scores[lang]++;
            }
        }
    }

    // Encontrar el ganador
    let winner: SupportedLanguage = 'es';
    let maxScore = 0;

    for (const lang of SUPPORTED_LANGUAGES) {
        if (scores[lang] > maxScore) {
            maxScore = scores[lang];
            winner = lang;
        }
    }

    // Umbral de confianza: si no hay suficientes matches, fallback a 'es'
    if (maxScore < 3) return 'es';

    return winner;
}
