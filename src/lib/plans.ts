/**
 * Plans and Limits System (Phase 9 - Billing & Usage Tracking)
 * Defines subscription tiers and their consumption limits.
 */

import { MetricPricing } from './schemas/billing';

export type PlanTier = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';

export interface PlanLimits {
    tier: PlanTier;
    name: string;
    price_monthly: number;
    price_yearly: number;
    limits: {
        llm_tokens_per_month: number;      // Gemini AI Tokens
        storage_bytes: number;             // Cloudinary Storage
        vector_searches_per_month: number; // RAG Searches
        api_requests_per_month: number;    // API Calls
        users: number;                     // Users per tenant
        spaces_per_tenant: number;         // Total spaces per tenant
        spaces_per_user: number;           // Spaces per individual user
    };
    overage: {
        tokens: number;      // Price per excess token
        storage: number;     // Price per excess byte
        searches: number;    // Price per excess search
    };
    metrics: Record<string, MetricPricing>; // standardized for Phase 120.2
    stripePriceId?: string;
    features: string[];
}

/**
 * SaaS Plans Definition
 */
export const PLANS: Record<PlanTier, PlanLimits> = {
    FREE: {
        tier: 'FREE',
        name: 'Free Trial',
        price_monthly: 0,
        price_yearly: 0,
        limits: {
            llm_tokens_per_month: 100_000,        // 100k tokens/month (~75 analyses)
            storage_bytes: 50 * 1024 * 1024,      // 50 MB
            vector_searches_per_month: 500,       // 500 searches/month
            api_requests_per_month: 1_000,        // 1k requests/month
            users: 2,                             // 2 users
            spaces_per_tenant: 10,                // 10 total spaces/company
            spaces_per_user: 3,                   // 3 personal spaces/user
        },
        overage: { tokens: 0, storage: 0, searches: 0 },
        metrics: {
            llm_tokens_per_month: { type: 'FLAT_FEE_OVERAGE', includedUnits: 100_000, overagePrice: 0, currency: 'EUR' },
            storage_bytes: { type: 'FLAT_FEE_OVERAGE', includedUnits: 50 * 1024 * 1024, overagePrice: 0, currency: 'EUR' }
        },
        stripePriceId: '',
        features: [
            'Dual-Engine Extraction (OCR + AI)',
            'Hybrid Vector Search',
            'Basic Audit-Trail',
            'Email support',
        ],
    },
    BASIC: {
        tier: 'BASIC',
        name: 'Basic Business',
        price_monthly: 49,
        price_yearly: 490,
        limits: {
            llm_tokens_per_month: 500_000,
            storage_bytes: 1 * 1024 * 1024 * 1024, // 1 GB
            vector_searches_per_month: 2_000,
            api_requests_per_month: 5_000,
            users: 5,
            spaces_per_tenant: 50,
            spaces_per_user: 10,
        },
        overage: {
            tokens: 0.00001, // $0.01 per 1k
            storage: 0.10 / (1024 * 1024 * 1024), // $0.10 per GB
            searches: 0.001
        },
        metrics: {
            llm_tokens_per_month: { type: 'FLAT_FEE_OVERAGE', includedUnits: 500_000, overagePrice: 0.00001, currency: 'EUR' },
            storage_bytes: { type: 'FLAT_FEE_OVERAGE', includedUnits: 1024 * 1024 * 1024, overagePrice: 0.10 / (1024 * 1024 * 1024), currency: 'EUR' }
        },
        stripePriceId: process.env.STRIPE_PRICE_BASIC || '',
        features: [
            'Everything in Free',
            'Basic Branding',
            'SLA 99.0%',
        ],
    },
    PRO: {
        tier: 'PRO',
        name: 'Professional',
        price_monthly: 99,
        price_yearly: 990, // 2 months free
        limits: {
            llm_tokens_per_month: 1_000_000,      // 1M tokens/month (~750 analyses)
            storage_bytes: 5 * 1024 * 1024 * 1024, // 5 GB
            vector_searches_per_month: 10_000,    // 10k searches/month
            api_requests_per_month: 50_000,       // 50k requests/month
            users: 10,                            // 10 users
            spaces_per_tenant: 200,                // 200 total spaces
            spaces_per_user: 20,                   // 20 spaces per user
        },
        overage: {
            tokens: 0.000005, // $0.005 per 1k
            storage: 0.05 / (1024 * 1024 * 1024), // $0.05 per GB
            searches: 0.0005
        },
        metrics: {
            llm_tokens_per_month: { type: 'FLAT_FEE_OVERAGE', includedUnits: 1_000_000, overagePrice: 0.000005, currency: 'EUR' },
            storage_bytes: { type: 'FLAT_FEE_OVERAGE', includedUnits: 5 * 1024 * 1024 * 1024, overagePrice: 0.05 / (1024 * 1024 * 1024), currency: 'EUR' }
        },
        stripePriceId: process.env.STRIPE_PRICE_PRO || '',
        features: [
            'Everything in Free',
            'Audit-Trail Pro (full traceability)',
            'Custom Prompts',
            'Webhooks',
            'Priority support',
            'SLA 99.5%',
        ],
    },
    ENTERPRISE: {
        tier: 'ENTERPRISE',
        name: 'Enterprise',
        price_monthly: 499,
        price_yearly: 4990,
        limits: {
            llm_tokens_per_month: Infinity,       // Unlimited
            storage_bytes: Infinity,              // Unlimited
            vector_searches_per_month: Infinity,  // Unlimited
            api_requests_per_month: Infinity,     // Unlimited
            users: Infinity,                      // Unlimited
            spaces_per_tenant: Infinity,         // Unlimited
            spaces_per_user: Infinity,           // Unlimited
        },
        overage: { tokens: 0, storage: 0, searches: 0 },
        metrics: {
            llm_tokens_per_month: { type: 'FIXED', unitPrice: 0, currency: 'EUR' }, // Unlimited = 0 cost
            storage_bytes: { type: 'FIXED', unitPrice: 0, currency: 'EUR' }
        },
        stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE || '',
        features: [
            'Everything in Pro',
            'Unlimited resources',
            'Advanced Multi-tenant',
            'SSO (SAML/OAuth)',
            'Dedicated support',
            'SLA 99.9%',
            'Custom integrations',
            'On-premise deployment (optional)',
        ],
    },
};

/**
 * Retrieves the plan for a tenant (defaults to FREE)
 */
export function getPlanForTenant(tier?: PlanTier): PlanLimits {
    return PLANS[tier || 'FREE'];
}

/**
 * Checks if a tenant has exceeded a specific limit
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
 * Calculates the estimated cost for a tenant based on consumption
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

    // Enterprise has no overage costs
    if (tier === 'ENTERPRISE') return 0;

    let cost = 0;

    // Excess Tokens
    const excessTokens = Math.max(0, usage.tokens - plan.limits.llm_tokens_per_month);
    cost += excessTokens * plan.overage.tokens;

    // Excess Storage
    const excessStorage = Math.max(0, usage.storage - plan.limits.storage_bytes);
    cost += excessStorage * plan.overage.storage;

    // Excess Searches
    const excessSearches = Math.max(0, usage.searches - plan.limits.vector_searches_per_month);
    cost += excessSearches * plan.overage.searches;

    return Math.round(cost * 100) / 100; // Round to 2 decimals
}
