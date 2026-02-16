import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { QuotaService } from '@/lib/quota-service';
import { UsageService } from '@/lib/usage-service';
import { logEvento } from '@/lib/logger';
import { UserRole } from '@/types/roles';
import crypto from 'crypto';

const SLA_MAX_MS = 500;

/**
 * GET /api/admin/billing/usage
 * Returns unified usage stats for the authenticated tenant's billing dashboard.
 * Includes current period consumption, limits, and metric status.
 * Phase 133.7: Unified Usage API
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await requireRole([
            UserRole.ADMIN,
            UserRole.SUPER_ADMIN,
            UserRole.ADMINISTRATIVE
        ]);

        const tenantId = session.user.tenantId;

        // Parallel fetch: quota stats + ROI metrics
        const [usageStats, roiMetrics] = await Promise.all([
            QuotaService.getTenantUsageStats(tenantId),
            UsageService.getTenantROI(tenantId)
        ]);

        const duration = Date.now() - start;

        if (duration > SLA_MAX_MS) {
            await logEvento({
                level: 'WARN',
                source: 'BILLING_SERVICE',
                action: 'SLA_EXCEEDED',
                correlationId,
                message: `GET /api/admin/billing/usage exceeded SLA: ${duration}ms`,
                details: { duration_ms: duration, tenantId }
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                usage: usageStats,
                roi: roiMetrics
            }
        });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_BILLING_USAGE', correlationId);
    }
}
