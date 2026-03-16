import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { ObservabilityRepository } from '@/services/observability/ObservabilityRepository';
import { checkSla } from '@/lib/logger';
import { z } from 'zod';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';

const SLASchema = z.object({
    days: z.coerce.number().min(1).max(30).default(7)
});

/**
 * GET /api/admin/audit/sla
 * Fetch aggregated SLA metrics to display performance dashboards.
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_AUDIT_SLA', action: 'FETCH_METRICS' },
        async ({ log, correlationId }) => {
            const start = Date.now();
            try {
                await requirePermission('audit:stats', 'read');

                const { searchParams } = new URL(req.url);
                const args = Object.fromEntries(searchParams);
                const { days } = SLASchema.parse(args);

                const metrics = await ObservabilityRepository.getSlaMetrics(days);

                const duration = Date.now() - start;
                await checkSla(duration, 200, 'API_ADMIN_AUDIT_SLA', 'GET_SLA_METRICS', correlationId, { days });

                await log({
                    message: `Successfully retrieved SLA metrics for the last ${days} days`,
                    details: { days, durationMs: duration }
                });

                return NextResponse.json({ 
                    success: true, 
                    metrics, 
                    timestamp: new Date().toISOString(),
                    correlationId 
                });
            } catch (error) {
                return handleApiError(error, 'API_ADMIN_AUDIT_SLA', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/audit/sla', thresholdMs: 1000 });
