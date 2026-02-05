import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { WorkflowTaskService } from '@/lib/workflow-task-service';
import { AppError, handleApiError } from '@/lib/errors';
import { z } from 'zod';

const UpdateStatusSchema = z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED']),
    notes: z.string().optional()
});

/**
 * PATCH /api/admin/workflow-tasks/[id]
 * Updates the status of a specific task.
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { id } = await params;
        const body = await req.json();
        const validated = UpdateStatusSchema.parse(body);

        const result = await WorkflowTaskService.updateStatus({
            id,
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name || session.user.email || 'Unknown User',
            status: validated.status,
            notes: validated.notes,
            correlationId
        });

        return NextResponse.json(result);

    } catch (error: any) {
        return handleApiError(error, 'API_WORKFLOW_TASK_PATCH', correlationId);
    }
}
