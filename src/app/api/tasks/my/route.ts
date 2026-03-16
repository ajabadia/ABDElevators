import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { WorkflowTaskService } from '@/services/ops/WorkflowTaskService';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/tasks/my
 * Lists tasks assigned to the current user.
 */
export const GET = withPerformanceSLA(async () =>
    withCorrelation(
        { level: 'INFO', source: 'APITASKS', action: 'LISTMYTASKS' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('workflow:task', 'read');

                const tenantId = session.user.tenantId;
                const userId = session.user.id;

                const tasks = await WorkflowTaskService.listTasks(tenantId, {
                    assignedUserId: userId
                }, session);

                await log({
                    message: 'My tasks retrieved',
                    details: {
                        userId,
                        tenantId,
                        count: tasks.length
                    }
                });

                return NextResponse.json({
                    success: true,
                    data: tasks,
                    count: tasks.length
                });

            } catch (error) {
                return handleApiError(error, 'APITASKS', correlationId);
            }
        }
    ),
    { endpoint: 'GET /api/tasks/my', thresholdMs: 1000 }
);
