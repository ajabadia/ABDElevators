import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { AnomalyDetectionService } from '@/services/ops/AnomalyDetectionService';
import { requirePermission } from '@/lib/auth';
async function GET_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        await requirePermission('platform:metrics', 'read');
        const [latencyAnomalies, errorAnomalies] = await Promise.all([
            AnomalyDetectionService.detectLatencyAnomalies(),
            AnomalyDetectionService.detectErrorAnomalies()
        ]);

        return NextResponse.json({
            success: true, anomalies: { latency: latencyAnomalies, errors: errorAnomalies, total: latencyAnomalies.length + errorAnomalies.length },
            timestamp: new Date(), correlationId
        });
    } catch (error: unknown) {
        return handleApiError(error, 'API_SUPERADMIN_ANOMALIES', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/superadmin/anomalies', thresholdMs: 1000 });
