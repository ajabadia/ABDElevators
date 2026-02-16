import { NextResponse } from 'next/server';
import { WorkflowAnalyticsService } from '@/lib/workflow-analytics-service';
import { AppError } from '@/lib/errors';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';

/**
 * GET /api/admin/workflows/analytics/[id]/logs
 * Returns the most recent execution logs for a workflow.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();
    const { id: workflowId } = await params;

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No session found');
        }

        const tenantId = session.user.tenantId;

        // Fetch the last 100 execution events
        const logs = await WorkflowAnalyticsService.getWorkflowLogs(workflowId, tenantId, 100);

        return NextResponse.json(logs);

    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_WORKFLOW_LOGS',
            action: 'GET_LOGS_FAILED',
            message: error.message,
            correlationId,
            details: { workflowId },
            stack: error.stack
        });

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
