import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { CaseTimelineService } from '@/services/ops/case-timeline-service';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/cases/[id]/timeline
 */
async function GET_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_CASES_TIMELINE', action: 'GET_EVENTS' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('cases:manage', 'read');
                const { id } = await context.params;

                const timeline = await CaseTimelineService.getTimelineForCase(id, session.user.tenantId);

                return NextResponse.json({ success: true, timeline, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_CASES_TIMELINE_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/cases/[id]/timeline', thresholdMs: 1000 });
