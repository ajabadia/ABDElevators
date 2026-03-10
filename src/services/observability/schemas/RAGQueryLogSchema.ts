import { z } from 'zod';
import { EntityIdSchema } from '@/lib/schemas/common';

/**
 * 🌊 ERA 12: RELATIONAL INTEGRITY
 * RAG Query Log Schema
 * Indispensable for industrial audit and performance tracking.
 */
export const RAGQueryLogSchema = z.object({
    _id: EntityIdSchema.optional(),
    tenantId: EntityIdSchema,
    userId: EntityIdSchema.optional(),
    spaceId: EntityIdSchema, // MANDATORY in Era 12 to avoid data islands

    query: z.string().min(1),
    normalizedQuery: z.string().optional(),
    responseSummary: z.string().optional(),

    // Quality Metrics (Aligned with RagJudge)
    metrics: z.object({
        relevance: z.number().min(0).max(1).optional(),
        faithfulness: z.number().min(0).max(1).optional(),
        answer_correctness: z.number().min(0).max(1).optional(),
    }).optional(),

    // Technical Stats
    durationMs: z.number().optional(),
    tokenUsage: z.object({
        input: z.number(),
        output: z.number(),
        total: z.number(),
    }).optional(),

    engineVersion: z.string().default('Era-12'),
    modelId: z.string().optional(),
    correlationId: z.string().uuid(),

    timestamp: z.date().default(() => new Date()),
});

export type RAGQueryLog = z.infer<typeof RAGQueryLogSchema>;
