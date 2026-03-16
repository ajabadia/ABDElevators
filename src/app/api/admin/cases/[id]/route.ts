import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { CaseService } from '@/services/ops/stub-ops-services';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/cases/[id]
 */
async function GET_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_CASES', action: 'GET_DETAIL' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('cases:manage', 'read');
                const { id } = await context.params;

                const caseData = await CaseService.getCaseById(id, session.user.tenantId);

                return NextResponse.json({ success: true, case: caseData, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_CASES_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/cases/[id]', thresholdMs: 1000 });
