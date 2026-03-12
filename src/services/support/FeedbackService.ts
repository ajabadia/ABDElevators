import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { LLMProposalSchema } from '@/lib/schemas/workflow-task';
import { z } from 'zod';

const FeedbackEntrySchema = z.object({
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
 * ⚡ PHASE 82: FeedbackService
 * Stores human feedback on AI decisions
 * for future training and evaluation (RIE).
 */
export class FeedbackService {
    /**
     * Records a new HITL feedback entry.
     */
    static async recordFeedback(entry: Partial<FeedbackEntry>, correlationId: string) {
        const validated = FeedbackEntrySchema.parse(entry);
        const collection = await getTenantCollection('ai_human_feedback');

        const result = await collection.insertOne({
            ...validated,
            tenantId: collection.tenantId
        });

        await logEvento({
            level: 'INFO',
            source: 'FEEDBACK_SERVICE',
            action: 'RECORD_FEEDBACK',
            message: `Feedback recorded for task ${validated.taskId} (Tenant: ${collection.tenantId})`,
            correlationId,
            details: {
                taskId: validated.taskId,
                category: validated.category,
                is_correction: validated.modelSuggestion !== validated.humanDecision
            }
        });

        return result.insertedId;
    }

    /**
     * Gets feedback metrics for a tenant.
     */
    static async getFeedbackMetrics(tenantId: string) {
        const collection = await getTenantCollection('ai_human_feedback');

        return await collection.aggregate([
            { $match: { tenantId } },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            }
        ]);
    }
}
