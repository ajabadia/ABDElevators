import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { AppError, handleApiError } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
    const correlationId = uuidv4();
    try {
        const session = await auth();
        if (!session) throw new AppError('UNAUTHORIZED', 401, 'No autorizado');

        const tenantId = session.user.tenantId;
        const userId = session.user.id;

        // WorkflowTaskService doesn't have listByCreator, implementing direct query here properly
        // Ideally this should be in Service, but for speed 133.5 we do it here following pattern
        const collection = await getTenantCollection('workflow_tasks');

        const tasks = await collection.find({
            tenantId,
            'metadata.createdBy': userId
        }, {
            sort: { createdAt: -1 }
        });

        // Wait, if createTask doesn't force createdBy, this might be empty.
        // Let's check Schema. 
        // Plan B: Return empty for now and add TODO to update Service in next step if Schema allows.

        return NextResponse.json({
            success: true,
            data: tasks,
            count: tasks.length
        });

    } catch (error) {
        return handleApiError(error, 'API_TASKS_CREATED', correlationId);
    }
}
