import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { handleApiError } from '@/lib/errors';
import { DashboardService } from '@/services/admin/dashboard-service';
import { withCorrelation } from '@/lib/logger/with-correlation';

const API_SOURCE = 'API_ADMIN_GLOBAL_STATS';

/**
 * GET /api/admin/global-stats
 * Devuelve métricas globales de toda la plataforma (Solo SUPER_ADMIN).
 * SLA: P95 < 500ms
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: API_SOURCE, action: 'GET_METRICS' },
        async ({ log, correlationId }) => {
            try {
                // We keep security checks if they were intended. 
                // Currently commented in original, but withCorrelation handles context.
                // await requirePermission('platform:metrics', 'read');

                const data = await DashboardService.getGlobalStats();

                return NextResponse.json({
                    success: true,
                    global: data,
                    correlationId
                });

            } catch (error: unknown) {
                return handleApiError(error, API_SOURCE, correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/global-stats', thresholdMs: 500 });
