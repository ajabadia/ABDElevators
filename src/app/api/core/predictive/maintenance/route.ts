import { NextRequest, NextResponse } from "next/server";
import { getPredictiveEngine } from "@/core/engine/index.server";
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { handleApiError } from "@/lib/errors";
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/core/predictive/maintenance
 * Retrieves the predictive maintenance dashboard (Phase 8).
 * SLA: P95 < 2000ms
 */
export const GET = withPerformanceSLA(async (req: NextRequest) =>
    withCorrelation(
        { level: 'INFO', source: 'APIPREDICTIVE_MAINTENANCE', action: 'GETFORECAST' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('technical:predictive', 'read');
                const tenantId = session.user.tenantId || process.env.SINGLE_TENANT_ID || 'default_tenant';

                const predictions = await getPredictiveEngine().getMaintenanceForecast(tenantId, correlationId);

                await log({
                    message: 'Predictive maintenance forecast retrieved',
                    details: {
                        tenantId,
                        count: predictions.length
                    }
                });

                return NextResponse.json({
                    success: true,
                    predictions,
                    correlationId
                });
            } catch (error: unknown) {
                return handleApiError(error, 'APIPREDICTIVE_MAINTENANCE', correlationId);
            }
        }
    ),
    { endpoint: 'GET /api/core/predictive/maintenance', thresholdMs: 2000 }
);
