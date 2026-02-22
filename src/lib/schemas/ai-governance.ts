import { z } from 'zod';
import { AI_MODEL_IDS } from '@abd/platform-core';

/**
 * Supported Gemini Models
 */
export const SUPPORTED_AI_MODELS = [
    AI_MODEL_IDS.GEMINI_2_5_FLASH,
    AI_MODEL_IDS.GEMINI_2_5_PRO,
    AI_MODEL_IDS.GEMINI_3_PRO_PREVIEW,
    AI_MODEL_IDS.EMBEDDING_1_0
] as const;

export type SupportedAiModel = typeof SUPPORTED_AI_MODELS[number];

/**
 * Zod Schema for Tenant AI Configuration
 */
export const TenantAiConfigSchema = z.object({
    tenantId: z.string(),
    defaultModel: z.enum(SUPPORTED_AI_MODELS).default('gemini-2.5-flash'),
    fallbackModel: z.enum(SUPPORTED_AI_MODELS).default('gemini-2.5-flash'),
    embeddingModel: z.enum(SUPPORTED_AI_MODELS).default('gemini-embedding-001'),

    // Functional Model Overrides (Phase 212)
    ragGeneratorModel: z.enum(SUPPORTED_AI_MODELS).optional(),
    ragQueryRewriterModel: z.enum(SUPPORTED_AI_MODELS).optional(),
    reportGeneratorModel: z.enum(SUPPORTED_AI_MODELS).optional(),
    workflowRouterModel: z.enum(SUPPORTED_AI_MODELS).optional(),
    workflowNodeAnalyzerModel: z.enum(SUPPORTED_AI_MODELS).optional(),
    ontologyRefinerModel: z.enum(SUPPORTED_AI_MODELS).optional(),
    queryEntityExtractorModel: z.enum(SUPPORTED_AI_MODELS).optional(),

    // Limits
    maxTokensPerRequest: z.number().default(4096),
    dailyTokenLimit: z.number().default(500000),
    dailyBudgetLimit: z.number().default(10), // USD

    // Safety & Governance
    safetyProfile: z.enum(['STRICT', 'BALANCED', 'CREATIVE']).default('BALANCED'),
    explainabilityEnabled: z.boolean().default(true),
    piiMaskingEnabled: z.boolean().default(false),

    updatedAt: z.date().optional(),
    updatedBy: z.string().optional()
});

export type TenantAiConfig = z.infer<typeof TenantAiConfigSchema>;
