import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { GoldenSetService } from '@/services/admin/stub-services';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/admin/ai/golden-sets/run
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_AI_GOLDEN_SET', action: 'RUN_BATCH' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('ai:golden-sets', 'manage');
                const body = await req.json();

                await log({ message: 'Initiating golden set evaluation batch', details: { goldenSetId: body.id } });
                const job = await GoldenSetService.runEvaluation(body.id, session.user.tenantId, correlationId);

                return NextResponse.json({ success: true, jobId: job.id, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_AI_GOLDEN_SET_RUN_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/ai/golden-sets/run', thresholdMs: 10000 });
