import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { WorkflowAnalyticsService } from '@/services/ops/workflow-analytics-service';
import { handleApiError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';

/**
 * GET /api/admin/workflows/analytics/[id]/logs
 * Returns the most recent execution logs for a workflow.
 */
async function GET_internal(
    request: NextRequest,
    context: { params: { id: string } }
) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('platform:metrics', 'read');
        const { id: workflowId } = context.params;
        const tenantId = session.user.tenantId;

        const logs = await WorkflowAnalyticsService.getWorkflowLogs(workflowId, tenantId, 100);
        return NextResponse.json(logs);

    } catch (error: unknown) {
        return handleApiError(error, 'API_WORKFLOW_LOGS', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/workflows/analytics/[id]/logs', thresholdMs: 1000 });
