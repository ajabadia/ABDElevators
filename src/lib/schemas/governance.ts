import { z } from 'zod';
import { TenantIdSchema, EntityIdSchema } from './core';

/**
 * 🗺️ ERA 16: AI STRATEGIC STEERING
 * Allows dynamic routing of tasks to specific prompt versions and models per tenant.
 */

export const AiSteeringModeSchema = z.enum(['PROD', 'SHADOW_COMPARE', 'DEBUG']);
export type AiSteeringMode = z.infer<typeof AiSteeringModeSchema>;

export const AiGovernanceConfigSchema = z.object({
    _id: z.any().optional(),
    tenantId: TenantIdSchema,
    task: z.string(), // e.g., 'RAG_QUALITY', 'ONTOLOGY_REFINEMENT', 'TECHNICAL_ANALYSIS'
    
    // Steering
    activePromptKey: z.string(),
    activePromptVersion: z.number(),
    modelId: z.string(),
    
    mode: AiSteeringModeSchema.default('PROD'),
    
    // Shadow configuration (for A/B testing at steering level)
    shadowPromptKey: z.string().optional(),
    shadowPromptVersion: z.number().optional(),
    shadowModelId: z.string().optional(),
    
    metadata: z.record(z.string(), z.any()).optional(),
    updatedAt: z.date().default(() => new Date()),
    updatedBy: z.string().optional(),
});

export type AiGovernanceConfig = z.infer<typeof AiGovernanceConfigSchema>;
