import { NextResponse } from 'next/server';
import { handleApiError, AppError } from '@/lib/errors';
import { QuotaService } from '@/services/security/quota-service';
import { UsageService } from '@/services/ops/usage-service';
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';

/**
 * GET /api/admin/billing/usage
 * Returns unified usage stats for the authenticated tenant's billing dashboard.
 * Includes current period consumption, limits, and metric status.
 * SLA: P95 < 500ms
 */
async function GET_internal(req: Request) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_BILLING_USAGE', action: 'FETCH_USAGE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('billing:usage', 'read');

                // 🛡️ [SECURITY] Layered Rate Limiting (Phase 451)
                const { success: rateLimitOk } = await checkRateLimit(session.user.id, LIMITS.ADMIN);
                if (!rateLimitOk) {
                    throw new AppError('FORBIDDEN', 429, 'Demasiadas consultas de uso. Por favor, espera.');
                }

                const tenantId = session.user.tenantId;

                // Parallel fetch: quota stats + ROI metrics
                const [usageStats, roiMetrics] = await Promise.all([
                    QuotaService.getTenantUsageStats(tenantId),
                    UsageService.getTenantROI(tenantId)
                ]);

                await log({
                    message: `Retrieved billing usage stats for tenant ${tenantId}`,
                    details: { tenantId }
                });

                return NextResponse.json({
                    success: true,
                    data: {
                        usage: usageStats,
                        roi: roiMetrics
                    },
                    correlationId
                });
            } catch (error) {
                return handleApiError(error, 'API_ADMIN_BILLING_USAGE_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/billing/usage', thresholdMs: 500 });
