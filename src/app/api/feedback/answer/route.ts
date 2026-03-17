import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { RagFeedbackSchema, type RagFeedbackInput } from '@/lib/schemas/feedback';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { TenantIdSchema } from '@/lib/schemas';

export const POST = withPerformanceSLA(async (req: NextRequest) =>
    withCorrelation(
        { level: 'INFO', source: 'APIFEEDBACK', action: 'SUBMITANSWERFEEDBACK' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('rag:query', 'read');
                const body = await req.json();
                const validated = RagFeedbackSchema.parse(body);
                const tenantId = TenantIdSchema.parse(session.user.tenantId);

                const collection = await getTenantCollection<RagFeedbackInput & { tenantId: any; userId: any; createdAt: Date; processed: boolean }>('rag_feedback', session, 'LOGS');
                await collection.insertOne({
                    ...validated,
                    tenantId,
                    userId: session.user.id as any,
                    createdAt: new Date(),
                    processed: false // Mark for background processing
                });

                await log({
                    message: `Feedback submitted for answer (${validated.uiContext || 'UNKNOWN_CONTEXT'})`,
                    details: {
                        tenantId,
                        userId: session.user.id,
                        type: validated.type,
                        answerId: validated.answerId,
                        uiContext: validated.uiContext
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
