import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { WorkflowTaskService } from '@/services/ops/WorkflowTaskService';
import { AppError, handleApiError } from '@/lib/errors';
import { UserRole } from '@/types/roles';
import { z } from 'zod';

/**
 * GET /api/admin/workflow-tasks
 * List pendings tasks for the tenant.
 * Security: requireRole([ADMIN, SUPER_ADMIN, COMPLIANCE, REVIEWER, TECHNICAL])
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') as any;
        const role = searchParams.get('role') as any;
        const caseId = searchParams.get('caseId');
        const getStats = searchParams.get('stats') === 'true';

        if (getStats) {
            const stats = await WorkflowTaskService.getTaskStats(session.user.tenantId);
            return NextResponse.json({ success: true, stats });
        }

        const tasks = await WorkflowTaskService.listTasks(session.user.tenantId, {
            status,
            assignedRole: role,
            caseId: caseId || undefined
        });

        return NextResponse.json({ success: true, tasks });

    } catch (error) {
        return handleApiError(error, 'API_WORKFLOW_TASKS_GET', correlationId);
    }
}
