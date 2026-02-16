/**
 * i18n Dynamic Keys Mapping
 * Phase 175.3: Static map to avoid dynamic key warnings in next-intl.
 */

export const ACTIVITY_TYPE_MAP: Record<string, string> = {
    'INGEST_SUCCESS': 'badges.ingest', // Using badges.ingest as a fallback since specific status is in knowledge namespace
    'INGEST_FAILED': 'badges.ingest',
    'SUPERADMIN_BYPASS': 'detail.admin_auth',
    'SYSTEM_MIGRATION': 'badges.unknown',
    'PASSWORD_CHANGE': 'detail.password_change',
    'CONFIG_UPDATE': 'badges.config',
};

export const WORKFLOW_STRATEGY_MAP: Record<string, string> = {
    'USER': 'transitions.strategies.user',
    'LLM_DIRECT': 'transitions.strategies.llm_direct',
    'LLM_SUGGEST_HUMAN_APPROVE': 'transitions.strategies.llm_suggest',
    'HUMAN_ONLY': 'transitions.strategies.human',
};

export const INDUSTRY_MAP: Record<string, string> = {
    'ELEVATORS': 'canvas.industries.elevators',
    'LEGAL': 'canvas.industries.legal',
    'BANKING': 'canvas.industries.banking',
    'HEALTHCARE': 'canvas.industries.healthcare',
    'GENERIC': 'canvas.industries.elevators', // Fallback to elevators or generic if added
};

/**
 * Safely resolves a dynamic translation key using a map.
 * @param map The static map to use
 * @param key The dynamic key from DB/Code (case-insensitive)
 * @param fallback Alternative if key is not found
 */
export function resolveI18nKey(map: Record<string, string>, key: string | undefined | null, fallback?: string): string {
    if (!key) return fallback || '';
    const normalizedKey = key.toUpperCase();
    return map[normalizedKey] || fallback || key;
}
