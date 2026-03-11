import { z } from 'zod';
import { EntityIdSchema, TenantIdSchema } from './common';

/**
 * Schema for RAG Answer Feedback
 * FASE 195.1
 */
export const RagFeedbackSchema = z.object({
    answerId: EntityIdSchema,
    type: z.enum(['thumbs_up', 'thumbs_down']),
    categories: z.array(z.enum(['incorrect', 'incomplete', 'irrelevant', 'source_wrong'])).optional(),
    expectedAnswer: z.string().max(1000).optional(),
    question: z.string().min(1),
    answer: z.string().optional(),
    documentSource: z.string().min(1),
    chunkIds: z.array(EntityIdSchema).optional(),
    label: z.enum(['correct', 'incorrect', 'irrelevant']).optional(),
    tenantId: TenantIdSchema.optional(), // Injected by server
    userId: EntityIdSchema.optional(),   // Injected by server
});

export type RagFeedbackInput = z.infer<typeof RagFeedbackSchema>;

/**
 * Schema for UX Micro-Survey responses.
 * Used after key user actions (Ingest, Admin Console, RAG query) to capture satisfaction signal.
 * FASE 265: UX Polish
 */
export const UxSurveySchema = z.object({
    /** Unique identifier for the survey trigger point (e.g. 'admin_console', 'ingest_complete') */
    context: z.enum(['admin_console', 'ingest_complete', 'rag_query', 'workflow_complete']),
    /** Thumbs up = positive, thumbs down = negative */
    sentiment: z.enum(['positive', 'negative']),
    /** Optional free-text comment (max 500 chars) */
    comment: z.string().max(500).optional(),
});

export type UxSurveyInput = z.infer<typeof UxSurveySchema>;

