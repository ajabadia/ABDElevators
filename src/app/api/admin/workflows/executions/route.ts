import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { UserRole } from '@/types/roles';
import { workflowExecutionRepository } from '@/lib/repositories/WorkflowExecutionRepository';
import { logEvento } from '@/lib/logger';

/**
 * ⚙️ API: GET /api/admin/workflows/executions
 * List recent workflow executions for monitoring (Era 12).
 */
export async function GET(request: Request) {
    const correlationId = crypto.randomUUID();

    const start = Date.now();
    try {
        const session = await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const status = searchParams.get('status');

        const filter: any = { tenantId: session.user.tenantId };
        if (status) filter.status = status;

        const executions = await workflowExecutionRepository.list(
            filter,
            { limit, sort: { startedAt: -1 } },
            session
        );

        const duration = Date.now() - start;
        if (duration > 500) {
            await logEvento({
                level: 'WARN',
                source: 'API_WORKFLOW_EXECUTIONS',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `GET /api/admin/workflows/executions took ${duration}ms (SLA: 500ms)`,
                correlationId,
                tenantId: session.user.tenantId,
                details: { durationMs: duration, limit }
            });
        }

        return NextResponse.json({
            success: true,
            executions
        });

    } catch (error: any) {
        const duration = Date.now() - start;
        await logEvento({
            level: 'ERROR',
            source: 'API_WORKFLOW_EXECUTIONS',
            action: 'LIST_ERROR',
            message: error.message,
            correlationId,
            details: { stack: error.stack, durationMs: duration }
        });
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
