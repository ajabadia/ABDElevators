import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { CaseWorkflowEngine as WorkflowEngine } from '@abd/workflow-engine/server';
import { requirePermission } from '@/lib/auth';
import { AppError, handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { TenantIdSchema } from '@/lib/schemas';

/**
 * POST /api/core/entities/[type]/[id]/transition
 * Executes a state transition in orders/cases.
 */
async function POST_internal(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'APICORE_ENTITIES_WORKFLOW', action: 'EXECUTETRANSITION' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('technical:analysis', 'write');
                const { id } = await context.params;
                const tenantId = TenantIdSchema.parse(session.user.tenantId);

                const body = await request.json();
                const { toState } = body;

                if (!toState) throw new AppError('VALIDATION_ERROR', 400, 'toState is required');

                const result = await WorkflowEngine.getInstance().executeTransition(
                    id, toState, tenantId, session.user.id, [session.user.role], correlationId
                );

                await log({
                    message: 'Workflow transition executed',
                    details: {
                        entityId: id,
                        toState,
                        tenantId
                    }
                });

                return NextResponse.json(result);
            } catch (error: unknown) {
                return handleApiError(error, 'APICORE_ENTITIES_WORKFLOW', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/technical/entities/[id]/transition', thresholdMs: 1000 });
