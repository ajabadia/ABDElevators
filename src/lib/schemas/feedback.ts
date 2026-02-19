import { z } from 'zod';

/**
 * Schema for RAG Answer Feedback
 * FASE 195.1
 */
export const RagFeedbackSchema = z.object({
    answerId: z.string().min(1),
    type: z.enum(['thumbs_up', 'thumbs_down']),
    categories: z.array(z.enum(['incorrect', 'incomplete', 'irrelevant', 'source_wrong'])).optional(),
    expectedAnswer: z.string().max(1000).optional(),
    question: z.string().min(1),
    documentSource: z.string().min(1),
    tenantId: z.string().optional(), // Injected by server
    userId: z.string().optional(),   // Injected by server
});

export type RagFeedbackInput = z.infer<typeof RagFeedbackSchema>;
