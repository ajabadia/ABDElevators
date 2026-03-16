import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { WorkflowAnalyticsService } from '@/services/ops/workflow-analytics-service';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/workflows/analytics/[id]/report
 * Generates a full PDF/JSON report for a workflow.
 */
async function GET_internal(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_WORKFLOWS_REPORT', action: 'GENERATE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('workflow:analytics', 'read');
                const { id: workflowId } = await context.params;

                await log({ message: `Generating analytic report for workflow ${workflowId}` });

                const report = await WorkflowAnalyticsService.generateReport(workflowId, session.user.tenantId);

                await log({ message: 'Workflow report generated successfully' });

                return NextResponse.json({ ...report, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_WORKFLOWS_REPORT_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/workflows/analytics/[id]/report', thresholdMs: 2000 });
