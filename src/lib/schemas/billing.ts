import { z } from 'zod';

/**
 * 💸 Billing & Usage Schemas
 */

export const UsageLogSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    type: z.enum(['LLM_TOKENS', 'STORAGE_BYTES', 'VECTOR_SEARCH', 'API_REQUEST', 'SAVINGS_TOKENS', 'EMBEDDING_OPS', 'REPORTS_GENERATED', 'RAG_PRECISION']),
    value: z.number(),                  // Cantidad (tokens, bytes, etc)
    resource: z.string(),                // 'gemini-1.5-pro', 'cloudinary', etc
    description: z.string().optional(),
    correlationId: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    timestamp: z.date().default(() => new Date()),
});
export type UsageLog = z.infer<typeof UsageLogSchema>;

export const PricingTypeSchema = z.enum(['FIXED', 'TIERED', 'RAPPEL', 'FLAT_FEE_OVERAGE']);
export type PricingType = z.infer<typeof PricingTypeSchema>;

export const PriceTierSchema = z.object({
    from: z.number(),
    to: z.number().nullable(),
    unitPrice: z.number(),
});
export type PriceTier = z.infer<typeof PriceTierSchema>;

export const RappelThresholdSchema = z.object({
    minUnits: z.number(),
    price: z.number(),
});
export type RappelThreshold = z.infer<typeof RappelThresholdSchema>;

export const MetricPricingSchema = z.object({
    type: PricingTypeSchema,
    currency: z.string().default('EUR'),
    unitPrice: z.number().optional(), // Para FIXED
    tiers: z.array(PriceTierSchema).optional(), // Para TIERED
    thresholds: z.array(RappelThresholdSchema).optional(), // Para RAPPEL
    baseFee: z.number().optional(), // Para FLAT_FEE_OVERAGE
    includedUnits: z.number().optional(), // Para FLAT_FEE_OVERAGE
    overagePrice: z.number().optional(), // Para FLAT_FEE_OVERAGE
    overageRules: z.array(z.object({
        thresholdPercent: z.number(), // e.g. 10 (110% usage of includedUnits)
        action: z.enum(['SURCHARGE_PERCENT', 'SURCHARGE_FIXED', 'BLOCK']),
        value: z.number().optional()  // percentage or fixed amount
    })).optional(),
});
export type MetricPricing = z.infer<typeof MetricPricingSchema>;

export const GlobalPricingPlanSchema = z.object({
    _id: z.any().optional(),
    name: z.string(), // "Standard", "Pro", "Premium", "Ultra"
    slug: z.string(), // "standard-plan", "pro-plan"
    description: z.string().optional(),
    features: z.array(z.string()).default([]), // ["10 informes/mes", "API Access", "Soporte 24/7"]
    isDefault: z.boolean().default(false),
    isPublic: z.boolean().default(true), // Para mostrar en la landing
    popular: z.boolean().default(false), // Etiqueta "Más popular"
    priceMonthly: z.number().optional(), // Fee base mensual si aplica
    metrics: z.record(z.string(), MetricPricingSchema),
});
export type GlobalPricingPlan = z.infer<typeof GlobalPricingPlanSchema>;

export const PriceScheduleSchema = z.object({
    metric: z.string(),
    pricing: MetricPricingSchema,
    startsAt: z.date(),
    endsAt: z.date().nullable(),
    nextPricingId: z.string().nullable(), // ID del plan al que revertir o saltar
});
export type PriceSchedule = z.infer<typeof PriceScheduleSchema>;

export const LoyaltyRuleSchema = z.object({
    name: z.string(),
    condition: z.object({
        minTenureMonths: z.number().optional(),
        minTotalSpend: z.number().optional(),
    }),
    reward: z.object({
        type: z.enum(['DISCOUNT_PERCENTAGE', 'FREE_CREDITS', 'PRICE_OVERRIDE']),
        value: z.number(),
        metric: z.string().optional(),
    }),
    active: z.boolean().default(true),
});
export type LoyaltyRule = z.infer<typeof LoyaltyRuleSchema>;

export const TenantBillingConfigSchema = z.object({
    tenantId: z.string(),
    planSlug: z.string().optional(), // El plan base actual (standard, pro, premium, ultra)
    overrides: z.record(z.string(), MetricPricingSchema).default({}),
    schedules: z.array(PriceScheduleSchema).default([]),
    appliedLoyaltyRules: z.array(z.string()).default([]),
    billingDay: z.number().default(1),
    paymentMethod: z.enum(['STRIPE', 'BANK_TRANSFER', 'MANUAL']).default('STRIPE'),
});
export type TenantBillingConfig = z.infer<typeof TenantBillingConfigSchema>;

export const TenantCreditSchema = z.object({
    tenantId: z.string(),
    metric: z.string(),
    balance: z.number(),
    source: z.enum(['GIFT_CODE', 'MANUAL_ADJUSTMENT', 'PROMO']),
    reason: z.string().optional(),
    expiryDate: z.date().nullable(),
});
export type TenantCredit = z.infer<typeof TenantCreditSchema>;
