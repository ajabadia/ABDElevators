import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { CaseWorkflowEngine as WorkflowEngine } from '@abd/workflow-engine/server';
import { requirePermission } from '@/lib/auth';
import { AppError, handleApiError } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';

/**
 * API para ejecutar transiciones de estado en pedidos/casos.
 */
async function POST_internal(
    request: NextRequest,
    context: { params: { id: string } }
) {
    const correlationId = uuidv4();
    try {
        const session = await requirePermission('technical:analysis', 'write');
        const { id } = context.params;

        const body = await request.json();
        const { toState } = body;

        if (!toState) throw new AppError('VALIDATION_ERROR', 400, 'toState is required');

        const result = await WorkflowEngine.getInstance().executeTransition(
            id, toState, session.user.tenantId, session.user.id, [session.user.role], correlationId
        );

        return NextResponse.json(result);
    } catch (error: unknown) {
        return handleApiError(error, 'WORKFLOW_TRANSITION_API', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/technical/entities/[id]/transition', thresholdMs: 1000 });
