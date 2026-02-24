import { NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { getTenantCollection } from '@/lib/db-tenant';
import { AppError, handleApiError } from '@/lib/errors';
import { WorkflowTaskService } from '@/services/ops/WorkflowTaskService';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
    const correlationId = uuidv4();
    try {
        const session = await enforcePermission('workflow:task', 'read');

        const tenantId = session.user.tenantId;
        const userId = session.user.id;

        const tasks = await WorkflowTaskService.listByCreator(tenantId, userId);

        return NextResponse.json({
            success: true,
            data: tasks,
            count: tasks.length
        });

    } catch (error) {
        return handleApiError(error, 'API_TASKS_CREATED', correlationId);
    }
}
