import { getErrorMessage } from '@/lib/errors-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { UserRole } from '@/types/roles';
import { workflowExecutionRepository } from '@/lib/repositories/WorkflowExecutionRepository';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { handleApiError } from '@/lib/errors';

/**
 * ⚙️ API: GET /api/admin/workflows/executions
 * List recent workflow executions for monitoring (Era 12).
 */
async function GET_internal(request: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_WORKFLOW_EXECUTIONS', action: 'LIST' },
        async ({ log, correlationId }) => {
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

                await log({
                    message: `Listed ${executions.length} workflow executions`,
                    details: { status, limit, tenantId: session.user.tenantId }
                });

                return NextResponse.json({
                    success: true,
                    executions
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_WORKFLOW_EXECUTIONS', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/workflows/executions', thresholdMs: 500 });
