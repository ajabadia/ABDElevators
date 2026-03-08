import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { QuotaService } from '@/services/security/quota-service';
import { UsageService } from '@/services/ops/usage-service';
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';

/**
 * GET /api/admin/billing/usage
 * Returns unified usage stats for the authenticated tenant's billing dashboard.
 * Includes current period consumption, limits, and metric status.
 * SLA: P95 < 500ms
 */
export const GET = withPerformanceSLA(async (req) => {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('billing:usage', 'read');

        const tenantId = session.user.tenantId;

        // Parallel fetch: quota stats + ROI metrics
        const [usageStats, roiMetrics] = await Promise.all([
            QuotaService.getTenantUsageStats(tenantId),
            UsageService.getTenantROI(tenantId)
        ]);

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
}, { endpoint: 'GET /api/admin/billing/usage', thresholdMs: 500 });
