import { getErrorMessage } from '@/lib/errors-helpers';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { KnowledgeReviewService } from '@/services/ingest/knowledge-review-service';
import { z } from 'zod';
import { withCorrelation } from '@/lib/logger/with-correlation';

const ReviewSchema = z.object({
    action: z.enum(['review', 'snooze']).optional().default('review'),
    nextReviewDate: z.coerce.date().optional(),
    notes: z.string().optional()
}).refine(data => data.action === 'snooze' || !!data.nextReviewDate, {
    message: "nextReviewDate is required for manual reviews",
    path: ["nextReviewDate"]
});

/**
 * Handle Manual Review of Knowledge Assets
 * POST /api/admin/knowledge-assets/[id]/review
 */
async function POST_internal (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_KNOWLEDGE_REVIEW', action: 'MANUAL_REVIEW' },
        async ({ log, correlationId }) => {
            const { id: assetId } = await params;

            try {
                const session = await requirePermission('knowledge', 'update');
                const body = await req.json();
                const { action, nextReviewDate, notes } = ReviewSchema.parse(body);

                if (action === 'snooze') {
                    await KnowledgeReviewService.snoozeReview(assetId, session);
                } else {
                    await KnowledgeReviewService.markAsReviewed(
                        assetId,
                        nextReviewDate!,
                        session,
                        notes
                    );
                }

                await log({
                    message: `Knowledge asset ${assetId} review handled: ${action}`,
                    details: { assetId, action, notes }
                });

                return NextResponse.json({ success: true, action });
            } catch (error: unknown) {
                if (error instanceof z.ZodError) {
                    return handleApiError(error, 'API_KNOWLEDGE_REVIEW_VAL', correlationId);
                }
                return handleApiError(error, 'API_KNOWLEDGE_REVIEW', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/knowledge-assets/[id]/review', thresholdMs: 1000 });
