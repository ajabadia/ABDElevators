import { ValidationError } from './errors';
import { logEvento } from './logger';

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
 * (Placeholder) Detecta el idioma de un texto y lo valida.
 * En el futuro esto podría llamar a una librería de detección de idioma.
 */
export async function detectAndValidateLanguage(text: string): Promise<SupportedLanguage> {
    // Por ahora simple fallback, pero centralizado para futura expansión
    return 'es';
}
