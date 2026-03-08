import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { connectDB, connectLogsDB } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { DashboardService } from '@/services/admin/dashboard-service';

/**
 * GET /api/admin/tenant-health
 * Returns vitality metrics specifically for the active tenant.
 * Includes ingest success rate, RAG latency, and security audit anomalies.
 * SLA: P95 < 300ms
 */
async function GET_internal(req: NextRequest) {
    let currentTenantId = 'unknown';
    try {
        const session = await requirePermission('tenant:health', 'read');
        const tenantId = session.user.tenantId;
        currentTenantId = tenantId || 'unknown';

        if (!tenantId) {
            throw new AppError('VALIDATION_ERROR', 400, 'Tenant ID not found in session');
        }

        const health = await DashboardService.getTenantHealth(tenantId);

        return NextResponse.json({
            success: true,
            health
        });

    } catch (error: unknown) {
        console.error(`[TENANT_HEALTH_ERROR] tenantId: ${currentTenantId}`, error);
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(new AppError('INTERNAL_ERROR', 500, message).toJSON(), { status: 500 });
    }
}

export const GET = withPerformanceSLA(GET_internal, {
    endpoint: 'GET /api/admin/tenant-health',
    thresholdMs: 300
});
