import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db';
import { UxSurveySchema } from '@/lib/schemas/feedback';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/feedback/ux-survey
 * Persists a UX micro-survey response (thumbs up/down + optional comment).
 */
export const POST = withPerformanceSLA(async (req: NextRequest) =>
    withCorrelation(
        { level: 'INFO', source: 'APIUXSURVEY', action: 'SUBMITUXSURVEY' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('rag:query', 'read');
                const body = await req.json();
                const validated = UxSurveySchema.parse(body);

                const collection = await getTenantCollection('ux_surveys', session);
                await collection.insertOne({
                    ...validated,
                    tenantId: session.user.tenantId,
                    userId: session.user.id,
                    createdAt: new Date(),
                });

                await log({
                    message: 'UX survey submitted',
                    details: {
                        tenantId: session.user.tenantId,
                        userId: session.user.id,
                        context: validated.context,
                        sentiment: validated.sentiment
                    },
                });

                return NextResponse.json({ success: true, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'APIUXSURVEY', correlationId);
            }
        }
    ),
    {
        endpoint: 'POST /api/feedback/ux-survey',
        thresholdMs: 500,
    }
);
