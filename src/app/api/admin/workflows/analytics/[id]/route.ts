import { NextResponse } from 'next/server';
import { WorkflowAnalyticsService } from '@/services/ops/workflow-analytics-service';
import { AppError, ValidationError } from '@/lib/errors';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { z } from 'zod';

const SearchParamsSchema = z.object({
    days: z.string().optional().transform(v => v ? Number(v) : 7),
});

/**
 * GET /api/admin/workflows/analytics/[id]
 * Returns aggregated heatmap and performance data for a workflow graph.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();
    const { id: workflowId } = await params;

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No session found');
        }

        const tenantId = session.user.tenantId;

        // Validation
        const { searchParams } = new URL(request.url);
        const { days } = SearchParamsSchema.parse({
            days: searchParams.get('days') || undefined
        });

        // Business Logic
        const stats = await WorkflowAnalyticsService.getWorkflowStats(workflowId, tenantId, days);

        await logEvento({
            level: 'INFO',
            source: 'API_WORKFLOW_ANALYTICS',
            action: 'GET_STATS',
            message: `Retrieved analytics for workflow ${workflowId}`,
            correlationId,
            details: { workflowId, days, duration_ms: Date.now() - startTime }
        });

        return NextResponse.json(stats);

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid parameters', details: error.issues }, { status: 400 });
        }
        if (error instanceof AppError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_WORKFLOW_ANALYTICS',
            action: 'GET_STATS_FAILED',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
