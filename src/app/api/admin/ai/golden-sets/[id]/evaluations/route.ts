import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { GoldenSetService } from '@/services/admin/GoldenSetService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/ai/golden-sets/[id]/evaluations
 */
async function GET_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_AI_EVALUATIONS', action: 'LIST' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('ai:golden-sets', 'read');
                const { id } = await context.params;

                const evaluations = await GoldenSetService.getEvaluationsForSet(id, session.user.tenantId);

                return NextResponse.json({ success: true, evaluations, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_AI_EVALUATIONS_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/ai/golden-sets/[id]/evaluations', thresholdMs: 1000 });
