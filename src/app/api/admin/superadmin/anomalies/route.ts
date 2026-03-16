import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { AnomalyDetectionService } from '@/services/ops/AnomalyDetectionService';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_SUPERADMIN_ANOMALIES', action: 'DETECT' },
        async ({ log, correlationId }) => {
            try {
                await requirePermission('platform:metrics', 'read');
                const [latencyAnomalies, errorAnomalies] = await Promise.all([
                    AnomalyDetectionService.detectLatencyAnomalies(),
                    AnomalyDetectionService.detectErrorAnomalies()
                ]);

                await log({
                    message: `Detected ${latencyAnomalies.length + errorAnomalies.length} platform anomalies`,
                    details: { latencyCount: latencyAnomalies.length, errorCount: errorAnomalies.length }
                });

                return NextResponse.json({
                    success: true, anomalies: { latency: latencyAnomalies, errors: errorAnomalies, total: latencyAnomalies.length + errorAnomalies.length },
                    timestamp: new Date(), correlationId
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_SUPERADMIN_ANOMALIES', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/superadmin/anomalies', thresholdMs: 1000 });
