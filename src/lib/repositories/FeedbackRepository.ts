import { BaseRepository } from './BaseRepository';
import { z } from 'zod';

export const FeedbackEntrySchema = z.object({
    tenantId: z.string(),
    taskId: z.string(),
    workflowId: z.string().optional(),
    nodeLabel: z.string().optional(),
    modelSuggestion: z.any(),
    humanDecision: z.any(),
    correction: z.string().optional(),
    category: z.string().optional(),
    rejectionReason: z.string().optional(),
    correlationId: z.string().optional(),
    createdAt: z.date().default(() => new Date()),
});

export type FeedbackEntry = z.infer<typeof FeedbackEntrySchema>;

/**
 * 🗳️ FeedbackRepository
 * Standardized data access for AI human feedback.
 * Cluster: LOGS (Since feedback is analytical/audit data)
 */
export class FeedbackRepository extends BaseRepository<FeedbackEntry> {
    constructor() {
        super('ai_human_feedback');
    }
}

export const feedbackRepository = new FeedbackRepository();
