import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { handleApiError, AppError } from '@/lib/errors';
import { DashboardService } from '@/services/admin/dashboard-service';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/tenant-health
 * Returns vitality metrics specifically for the active tenant.
 * Includes ingest success rate, RAG latency, and security audit anomalies.
 * SLA: P95 < 300ms
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_TENANT_HEALTH', action: 'FETCH_HEALTH' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('tenant:health', 'read');
                const tenantId = session.user.tenantId;

                if (!tenantId) {
                    throw new AppError('VALIDATION_ERROR', 400, 'Tenant ID not found in session');
                }

                const health = await DashboardService.getTenantHealth(tenantId);

                await log({
                    message: `Retrieved health metrics for tenant ${tenantId}`,
                    details: { tenantId }
                });

                return NextResponse.json({
                    success: true,
                    health
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_TENANT_HEALTH', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, {
    endpoint: 'GET /api/admin/tenant-health',
    thresholdMs: 300
});
