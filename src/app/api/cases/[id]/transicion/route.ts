import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { CaseWorkflowEngine as WorkflowEngine } from '@abd/workflow-engine/server';
import { handleApiError, ValidationError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

async function POST_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string }> } // Standard Promise-based params for Next.js 15+
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_CASOS_WORKFLOW', action: 'TRANSITION' },
        async ({ correlationId, log }) => {
            try {
                const session = await requirePermission('technical:analysis', 'write');
                const { id } = await context.params;
                const body = await req.json();
                const { toState } = body;

                if (!toState) throw new ValidationError('toState is required');

                await log({
                    message: `Executing transition for case ${id} to state ${toState}`,
                    details: { caseId: id, toState },
                    tenantId: session.user.tenantId
                });

                const result = await WorkflowEngine.getInstance().executeTransition(
                    id, 
                    toState, 
                    session.user.tenantId, 
                    session.user.id, 
                    [session.user.role], 
                    correlationId
                );

                await log({
                    message: `Transition executed successfully for case ${id}`,
                    details: { caseId: id, resultStatus: result.status },
                    tenantId: session.user.tenantId
                });

                return NextResponse.json({ ...result });
            } catch (error: unknown) {
                return handleApiError(error, 'API_CASOS_TRANSITION_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/cases/[id]/transicion', thresholdMs: 1000 });
