import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { EnvironmentService } from '@/services/admin/EnvironmentService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/admin/environments/promote
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_ENV_PROMOTION', action: 'PROMOTE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('platform:settings', 'manage');
                const body = await req.json();

                await log({ message: 'Environment promotion initiated', details: { from: body.from, to: body.to } });
                const result = await EnvironmentService.promoteConfiguration(body, session.user.tenantId, correlationId);

                return NextResponse.json({ success: true, result, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_ENV_PROMOTE_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/environments/promote', thresholdMs: 5000 });
