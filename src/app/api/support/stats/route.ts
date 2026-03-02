import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { SupportStatsService } from '@/services/support/SupportStatsService';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';

/**
 * GET /api/support/stats
 * Returns support metrics for dashboards.
 */
export const GET = withPerformanceSLA(async (req: NextRequest) => {
    const correlationId = crypto.randomUUID();
    try {
        // Requires admin-level support permissions
        const session = await enforcePermission('support:admin', 'read');

        const { searchParams } = new URL(req.url);
        const globalVisible = searchParams.get('global') === 'true';

        // Isolation: If not superadmin, only see current tenant stats
        const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
        const targetTenantId = (!isSuperAdmin || !globalVisible) ? session.user.tenantId : undefined;

        const stats = await SupportStatsService.getSupportStats(targetTenantId);

        return NextResponse.json({
            success: true,
            stats,
            context: {
                tenantId: targetTenantId || 'GLOBAL',
                timestamp: new Date()
            }
        });
    } catch (error) {
        return handleApiError(error, 'API_SUPPORT_STATS', correlationId);
    }
}, { endpoint: 'API /api/support/stats', thresholdMs: 300 });
