import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db';
import { RagFeedbackSchema } from '@/lib/schemas/feedback';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

export const POST = withPerformanceSLA(async (req: NextRequest) =>
    withCorrelation(
        { level: 'INFO', source: 'APIFEEDBACK', action: 'SUBMITANSWERFEEDBACK' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('rag:query', 'read');
                const body = await req.json();
                const validated = RagFeedbackSchema.parse(body);

                const collection = await getTenantCollection('rag_feedback', session);
                await collection.insertOne({
                    ...validated,
                    tenantId: session.user.tenantId,
                    userId: session.user.id,
                    createdAt: new Date(),
                    processed: false // Mark for background processing
                });

                await log({
                    message: 'Feedback submitted for answer',
                    details: {
                        tenantId: session.user.tenantId,
                        userId: session.user.id,
                        type: validated.type,
                        answerId: validated.answerId
                    }
                });

                return NextResponse.json({ success: true, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'APIFEEDBACK', correlationId);
            }
        }
    ),
    { endpoint: 'POST /api/feedback/answer', thresholdMs: 1000 }
);
