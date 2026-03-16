import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { OperationKpiService } from '@/services/ops/operation-kpi-service';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/operations/ingest-kpis
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_OPS_KPI', action: 'GET_METRICS' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('ops:metrics', 'read');
                const kpis = await OperationKpiService.getIngestKPIs(session.user.tenantId);

                return NextResponse.json({ success: true, kpis, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_OPS_INGEST_KPI_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/operations/ingest-kpis', thresholdMs: 1000 });
