import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db';
import { UxSurveySchema } from '@/lib/schemas/feedback';
import { logEvento } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';

/**
 * POST /api/feedback/ux-survey
 * Persists a UX micro-survey response (thumbs up/down + optional comment).
 */
async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('rag:query', 'read');
        const body = await req.json();
        const validated = UxSurveySchema.parse(body);

        const collection = await getTenantCollection('ux_surveys', session as any);
        await collection.insertOne({
            ...validated,
            tenantId: session.user.tenantId,
            userId: session.user.id,
            createdAt: new Date(),
        });

        await logEvento({
            level: 'INFO',
            source: 'API_UX_SURVEY',
            action: 'SUBMIT_SURVEY',
            message: `UX survey submitted: context=${validated.context}, sentiment=${validated.sentiment}`,
            correlationId,
            details: { context: validated.context, sentiment: validated.sentiment },
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return handleApiError(error, 'API_UX_SURVEY', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, {
    endpoint: 'POST /api/feedback/ux-survey',
    thresholdMs: 500,
});
