import { feedbackRepository, FeedbackEntrySchema, type FeedbackEntry } from '@/lib/repositories/FeedbackRepository';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { getSystemSession } from '@/lib/sessions/system-session';
import { TenantId } from '@/lib/schemas/common';

/**
 * ⚡ PHASE 82: FeedbackService
 * Stores human feedback on AI decisions
 * for future training and evaluation (RIE).
 */
export class FeedbackService {
    /**
     * Records a new HITL feedback entry.
     */
    static async recordFeedback(entry: Partial<FeedbackEntry>, tenantId: TenantId) {
        return withCorrelation({ level: 'INFO', source: 'FEEDBACK_SERVICE', action: 'RECORD_FEEDBACK', tenantId }, async ({ log, correlationId }) => {
            const validated = FeedbackEntrySchema.parse(entry);
            const systemSession = getSystemSession(tenantId);

            const insertedId = await feedbackRepository.create({
                ...validated,
                tenantId
            } as any, systemSession);

            await log({
                message: `Feedback recorded for task ${validated.taskId} (Tenant: ${tenantId})`,
                details: {
                    taskId: validated.taskId,
                    category: validated.category,
                    is_correction: validated.modelSuggestion !== validated.humanDecision
                }
            });

            return insertedId;
        });
    }

    /**
     * Gets feedback metrics for a tenant.
     */
    static async getFeedbackMetrics(tenantId: TenantId) {
        return await feedbackRepository.aggregate([
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
