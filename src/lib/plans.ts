/**
 * Sistema de Planes y Límites (Fase 9 - Billing & Usage Tracking)
 * Define los tiers de suscripción y sus límites de consumo.
 */

export type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface PlanLimits {
    tier: PlanTier;
    name: string;
    price_monthly: number;
    price_yearly: number;
    limits: {
        llm_tokens_per_month: number;      // Tokens de Gemini AI
        storage_bytes: number;             // Almacenamiento en Cloudinary
        vector_searches_per_month: number; // Búsquedas RAG
        api_requests_per_month: number;    // Llamadas API
        users: number;                     // Usuarios por tenant
    };
    features: string[];
}

/**
 * Definición de Planes SaaS
 */
export const PLANS: Record<PlanTier, PlanLimits> = {
    FREE: {
        tier: 'FREE',
        name: 'Free Trial',
        price_monthly: 0,
        price_yearly: 0,
        limits: {
            llm_tokens_per_month: 100_000,        // 100k tokens/mes (~75 análisis)
            storage_bytes: 50 * 1024 * 1024,      // 50 MB
            vector_searches_per_month: 500,       // 500 búsquedas/mes
            api_requests_per_month: 1_000,        // 1k requests/mes
            users: 2,                             // 2 usuarios
        },
        features: [
            'Dual-Engine Extraction (OCR + AI)',
            'Hybrid Vector Search',
            'Audit-Trail básico',
            'Soporte por email',
        ],
    },
    PRO: {
        tier: 'PRO',
        name: 'Professional',
        price_monthly: 99,
        price_yearly: 990, // 2 meses gratis
        limits: {
            llm_tokens_per_month: 1_000_000,      // 1M tokens/mes (~750 análisis)
            storage_bytes: 5 * 1024 * 1024 * 1024, // 5 GB
            vector_searches_per_month: 10_000,    // 10k búsquedas/mes
            api_requests_per_month: 50_000,       // 50k requests/mes
            users: 10,                            // 10 usuarios
        },
        features: [
            'Todo lo de Free',
            'Audit-Trail Pro (trazabilidad completa)',
            'Prompts personalizados',
            'Webhooks',
            'Soporte prioritario',
            'SLA 99.5%',
        ],
    },
    ENTERPRISE: {
        tier: 'ENTERPRISE',
        name: 'Enterprise',
        price_monthly: 499,
        price_yearly: 4990,
        limits: {
            llm_tokens_per_month: Infinity,       // Ilimitado
            storage_bytes: Infinity,              // Ilimitado
            vector_searches_per_month: Infinity,  // Ilimitado
            api_requests_per_month: Infinity,     // Ilimitado
            users: Infinity,                      // Ilimitado
        },
        features: [
            'Todo lo de Pro',
            'Recursos ilimitados',
            'Multi-tenant avanzado',
            'SSO (SAML/OAuth)',
            'Dedicated support',
            'SLA 99.9%',
            'Custom integrations',
            'On-premise deployment (opcional)',
        ],
    },
};

/**
 * Obtiene el plan de un tenant (por defecto FREE)
 */
export function getPlanForTenant(tier?: PlanTier): PlanLimits {
    return PLANS[tier || 'FREE'];
}

/**
 * Verifica si un tenant ha excedido un límite específico
 */
export function hasExceededLimit(
    currentUsage: number,
    limit: number
): { exceeded: boolean; percentage: number } {
    if (limit === Infinity) {
        return { exceeded: false, percentage: 0 };
    }

    const percentage = (currentUsage / limit) * 100;
    return {
        exceeded: currentUsage >= limit,
        percentage: Math.min(percentage, 100),
    };
}

/**
 * Calcula el costo estimado para un tenant según su consumo
 * (Para planes con sobrecostos por exceso - futuro)
 */
export function calculateOverageCost(
    tier: PlanTier,
    usage: {
        tokens: number;
        storage: number;
        searches: number;
    }
): number {
    const plan = PLANS[tier];

    // Enterprise no tiene sobrecostos
    if (tier === 'ENTERPRISE') return 0;

    let cost = 0;

    // Tokens excedentes: $0.01 por cada 1k tokens
    const excessTokens = Math.max(0, usage.tokens - plan.limits.llm_tokens_per_month);
    cost += (excessTokens / 1000) * 0.01;

    // Storage excedente: $0.10 por GB/mes
    const excessStorage = Math.max(0, usage.storage - plan.limits.storage_bytes);
    cost += (excessStorage / (1024 * 1024 * 1024)) * 0.10;

    // Búsquedas excedentes: $0.001 por búsqueda
    const excessSearches = Math.max(0, usage.searches - plan.limits.vector_searches_per_month);
    cost += excessSearches * 0.001;

    return Math.round(cost * 100) / 100; // Redondear a 2 decimales
}
