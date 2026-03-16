import { NextResponse } from 'next/server';
import { IntelligenceService } from '@/services/admin/IntelligenceService';
import { requirePermission } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/intelligence/stats
 * Returns global intelligence metrics.
 */
async function GET_internal() {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_INTELLIGENCE_STATS', action: 'FETCH' },
        async ({ log, correlationId }) => {
            try {
                await requirePermission('intelligence:stats', 'read');

                const stats = await IntelligenceService.getStats();

                await log({
                    message: 'Global intelligence metrics retrieved',
                    details: { statsSummary: stats ? 'Available' : 'None' }
                });

                return NextResponse.json({ success: true, stats });
            } catch (error) {
                return handleApiError(error, 'API_ADMIN_INTELLIGENCE_STATS_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/intelligence/stats', thresholdMs: 300 });
