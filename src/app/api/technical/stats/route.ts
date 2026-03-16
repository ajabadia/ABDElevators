import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { TechnicalStatsService } from '@/services/core/TechnicalStatsService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/technical/stats
 * Provides technical KPIs for the infrastructure dashboard.
 * SLA: P95 < 300ms
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_TECHNICAL_STATS', action: 'GET_KPI' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('technical:stats', 'read');
                const tenantId = session.user.tenantId;

                await log({
                    message: 'Gathering technical infrastructure metrics',
                    tenantId
                });

                const stats = await TechnicalStatsService.getTechnicalKPIs(tenantId);

                await log({
                    message: 'Technical stats retrieved successfully',
                    tenantId
                });

                return NextResponse.json({
                    success: true,
                    stats,
                    correlationId
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_TECHNICAL_STATS_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/technical/stats', thresholdMs: 300 });
