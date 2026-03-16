import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { WorkflowTaskService } from '@/services/ops/workflow-task-service';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/workflow-tasks/[id]
 */
async function GET_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_WORKFLOW_TASKS', action: 'GET' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('workflow:tasks', 'read');
                const { id } = await context.params;

                const task = await WorkflowTaskService.getTaskById(id, session.user.tenantId);

                return NextResponse.json({ success: true, task, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_WORKFLOW_TASKS_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/workflow-tasks/[id]', thresholdMs: 500 });
