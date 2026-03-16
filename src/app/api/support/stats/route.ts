import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { SupportStatsService } from '@/services/support/SupportStatsService';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/support/stats
 * Returns support metrics for dashboards.
 */
export const GET = withPerformanceSLA(async (req: NextRequest) =>
    withCorrelation(
        { level: 'INFO', source: 'APISUPPORTSTATS', action: 'GETSTATS' },
        async ({ log, correlationId }) => {
            try {
                // Requires admin-level support permissions
                const session = await requirePermission('support:admin', 'read');

                const { searchParams } = new URL(req.url);
                const globalVisible = searchParams.get('global') === 'true';

                // Isolation: If not superadmin, only see current tenant stats
                const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
                const targetTenantId = (!isSuperAdmin || !globalVisible) ? session.user.tenantId : undefined;

                const stats = await SupportStatsService.getSupportStats(targetTenantId);

                await log({
                    message: 'Support stats retrieved',
                    details: {
                        tenantId: targetTenantId || 'GLOBAL',
                        isGlobal: globalVisible && isSuperAdmin
                    }
                });

                return NextResponse.json({
                    success: true,
                    stats,
                    context: {
                        tenantId: targetTenantId || 'GLOBAL',
                        timestamp: new Date()
                    }
                });
            } catch (error) {
                return handleApiError(error, 'APISUPPORTSTATS', correlationId);
            }
        }
    ),
    { endpoint: 'API /api/support/stats', thresholdMs: 300 }
);
