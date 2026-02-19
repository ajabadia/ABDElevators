import { z } from 'zod';

/**
 * Supported Gemini Models
 */
export const SUPPORTED_AI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'text-embedding-004'
] as const;

export type SupportedAiModel = typeof SUPPORTED_AI_MODELS[number];

/**
 * Zod Schema for Tenant AI Configuration
 */
export const TenantAiConfigSchema = z.object({
    tenantId: z.string(),
    defaultModel: z.enum(SUPPORTED_AI_MODELS).default('gemini-2.5-flash'),
    fallbackModel: z.enum(SUPPORTED_AI_MODELS).default('gemini-1.5-flash'),

    // Limits
    maxTokensPerRequest: z.number().default(4096),
    dailyTokenLimit: z.number().default(500000),

    // Safety & Governance
    safetyProfile: z.enum(['STRICT', 'BALANCED', 'CREATIVE']).default('BALANCED'),
    explainabilityEnabled: z.boolean().default(true),

    updatedAt: z.date().optional(),
    updatedBy: z.string().optional()
});

export type TenantAiConfig = z.infer<typeof TenantAiConfigSchema>;
