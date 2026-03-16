import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { WorkflowAnalyticsService } from '@/services/ops/workflow-analytics-service';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { z } from 'zod';
import { withCorrelation } from '@/lib/logger/with-correlation';

const SearchParamsSchema = z.object({
    days: z.string().optional().transform(v => v ? Number(v) : 7),
});

/**
 * GET /api/admin/workflows/analytics/[id]
 * Returns aggregated heatmap and performance data for a workflow graph.
 */
async function GET_internal(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_WORKFLOWS_ANALYTICS', action: 'GET_REPORT' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('workflow:analytics', 'read');
                const tenantId = session.user.tenantId;
                const { id: workflowId } = await context.params;

                const { searchParams } = new URL(request.url);
                const { days } = SearchParamsSchema.parse({
                    days: searchParams.get('days') || undefined
                });

                await log({
                    message: `Generating workflow analytics for ${workflowId}`,
                    details: { days },
                    tenantId
                });

                const stats = await WorkflowAnalyticsService.getWorkflowStats(workflowId, tenantId, days);

                await log({
                    message: 'Workflow analytics generated',
                    details: { nodesScanned: stats.nodes?.length || 0 },
                    tenantId
                });

                return NextResponse.json({
                    ...stats,
                    correlationId
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_WORKFLOWS_ANALYTICS_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/workflows/analytics/[id]', thresholdMs: 1000 });
