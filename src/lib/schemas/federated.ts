import { z } from 'zod';
import { IndustryTypeSchema } from './core';

/**
 * ⚡ FASE 32: Federated Knowledge Networks (Vision 2027)
 * Schemas for anonymous pattern sharing.
 */

export const FederatedPatternSchema = z.object({
    _id: z.any().optional(),

    // Core Pattern Data (Sanitized)
    problemVector: z.string(), // Generic description
    solutionVector: z.string(), // Generic solution

    // Search Optimization
    keywords: z.array(z.string()),
    embedding: z.array(z.number()).optional(),

    // Impact & Reliability
    confidenceScore: z.number().min(0).max(1),
    validationCount: z.number().default(0),

    // Governance
    originIndustry: IndustryTypeSchema.default('GENERIC'),
    originTenantHash: z.string(), // One-way hash of tenantId
    status: z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'FLAGGED']).default('DRAFT'),

    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date())
});
export type FederatedPattern = z.infer<typeof FederatedPatternSchema>;
