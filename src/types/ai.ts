
import { z } from 'zod';

/**
 * ⚡ FASE 130.5: Unified AI Payload Types
 * Consistent structure for extraction, risk, and graph findings.
 */

export const AIFindingSourceSchema = z.enum(['extraction', 'risk_analysis', 'graph_discovery', 'federated_intel']);

export const AIModelFindingSchema = z.object({
    type: z.string(),
    model: z.string(),
    confidence: z.number().min(0).max(1),
    source: AIFindingSourceSchema.default('extraction'),
    sourceDoc: z.string().optional(),
    page: z.number().optional()
});

export const AIRiskFindingSchema = z.object({
    category: z.string(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    message: z.string(),
    impact: z.string().optional(),
    resolution: z.string().optional(),
    confidence: z.number().min(0).max(1),
    source: AIFindingSourceSchema.default('risk_analysis'),
    evidence: z.string().optional(),
});

export const AIGraphPatternSchema = z.object({
    subject: z.string(),
    relationship: z.string(),
    object: z.string(),
    source: AIFindingSourceSchema.default('graph_discovery'),
    metadata: z.record(z.string(), z.any()).optional(),
});

export interface AIModelFinding extends z.infer<typeof AIModelFindingSchema> { }
export interface AIRiskFinding extends z.infer<typeof AIRiskFindingSchema> { }
export interface AIGraphPattern extends z.infer<typeof AIGraphPatternSchema> { }

export type AIFinding = AIModelFinding | AIRiskFinding | AIGraphPattern;

/**
 * Metadata for tracking AI execution context.
 */
export interface AIExecutionContext {
    tenantId: string;
    correlationId: string;
    userId?: string;
    modelName?: string;
    durationMs?: number;
}
