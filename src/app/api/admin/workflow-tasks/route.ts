import { NextRequest, NextResponse } from 'next/server';
import { WorkflowTaskService } from '@/services/ops/WorkflowTaskService';
import { requirePermission } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { z } from 'zod';
import { withCorrelation } from '@/lib/logger/with-correlation';

const ListTasksSchema = z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED']).optional(),
    role: z.string().optional(),
    caseId: z.string().optional(),
    stats: z.preprocess((val) => val === 'true', z.boolean()).optional().default(false)
});

const UpdateTaskSchema = z.object({
    id: z.string().min(1),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED']),
    notes: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional()
});

/**
 * GET /api/admin/workflow-tasks
 * List pendings tasks for the tenant with performance SLA.
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_WORKFLOW_TASKS', action: 'LIST_TASKS' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('work_queues', 'read');

                const { searchParams } = new URL(req.url);
                const validated = ListTasksSchema.parse(Object.fromEntries(searchParams));

                if (validated.stats) {
                    const stats = await WorkflowTaskService.getTaskStats(session.user.tenantId, session as any);
                    return NextResponse.json({ success: true, stats });
                }

                const tasks = await WorkflowTaskService.listTasks(session.user.tenantId, {
                    status: validated.status as any,
                    assignedRole: validated.role as any,
                    caseId: validated.caseId
                }, session as any);

                await log({
                    message: `Listed ${tasks.length} workflow tasks`,
                    details: { status: validated.status, role: validated.role }
                });

                return NextResponse.json({ success: true, tasks });

            } catch (error) {
                return handleApiError(error, 'API_WORKFLOW_TASKS_GET', correlationId);
            }
        }
    );
}

/**
 * PATCH /api/admin/workflow-tasks
 * Update task status.
 */
async function PATCH_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_WORKFLOW_TASKS', action: 'UPDATE_TASK' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('work_queues', 'write');
                const body = await req.json();
                const validated = UpdateTaskSchema.parse(body);

                const result = await WorkflowTaskService.updateStatus({
                    ...validated,
                    tenantId: session.user.tenantId,
                    userId: session.user.id,
                    userName: (session.user.name || session.user.email || 'System') as string,
                    correlationId
                }, session as any);

                await log({
                    message: `Workflow task ${validated.id} updated to ${validated.status}`,
                    details: { taskId: validated.id, status: validated.status }
                });

                return NextResponse.json(result);

            } catch (error) {
                return handleApiError(error, 'API_WORKFLOW_TASKS_UPDATE', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'API_WORKFLOW_TASKS_GET', thresholdMs: 500 });
export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'API_WORKFLOW_TASKS_UPDATE', thresholdMs: 1000 });
