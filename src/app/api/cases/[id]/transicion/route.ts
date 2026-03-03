import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { CaseWorkflowEngine as WorkflowEngine } from '@abd/workflow-engine/server';
import { handleApiError, ValidationError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';

async function POST_internal(
    req: NextRequest,
    context: { params: { id: string } }
) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('technical:analysis', 'write');
        const { id } = context.params;
        const { toState } = await req.json();

        if (!toState) throw new ValidationError('toState is required');

        const result = await WorkflowEngine.getInstance().executeTransition(
            id, toState, session.user.tenantId, session.user.id, [session.user.role], correlationId
        );

        return NextResponse.json({ ...result });
    } catch (error: unknown) {
        return handleApiError(error, 'API_CASOS_TRANSITION', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/cases/[id]/transicion', thresholdMs: 1000 });
