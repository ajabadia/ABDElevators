import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { CaseWorkflowService } from '@/services/admin/CaseWorkflowService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/cases/[id]/workflow
 */
async function GET_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_CASES_WORKFLOW', action: 'GET_STATE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('cases:manage', 'read');
                const { id } = await context.params;

                const workflow = await CaseWorkflowService.getWorkflowState(id, session.user.tenantId);

                return NextResponse.json({ success: true, workflow, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_CASES_WORKFLOW_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/cases/[id]/workflow', thresholdMs: 1000 });
