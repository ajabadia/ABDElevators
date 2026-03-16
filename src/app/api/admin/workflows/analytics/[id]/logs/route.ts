import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { WorkflowAnalyticsService } from '@/services/ops/workflow-analytics-service';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/workflows/analytics/[id]/logs
 */
async function GET_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_WORKFLOWS_LOGS', action: 'GET' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('workflow:analytics', 'read');
                const { id } = await context.params;

                const logs = await WorkflowAnalyticsService.getWorkflowLogs(id, session.user.tenantId);

                return NextResponse.json({ success: true, logs, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_WORKFLOWS_LOGS_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/workflows/analytics/[id]/logs', thresholdMs: 1000 });
