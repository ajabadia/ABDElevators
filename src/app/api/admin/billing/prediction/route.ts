import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { AppError, handleApiError } from '@/lib/errors';
import { UsageService } from '@/services/ops/usage-service';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * 📈 Tenant Prediction API (Phase 110)
 * Provides cost projections based on actual usage for the Simulator.
 */
async function GET_internal (req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_BILLING_PREDICTION', action: 'GENERATE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('billing:prediction', 'read');
                const tenantId = session.user.tenantId;

                if (!tenantId) {
                    throw new AppError('FORBIDDEN', 403, 'No tienes un tenant asignado');
                }

                // 1. Obtener predicción basada en uso real
                const prediction = await UsageService.getTenantCostPrediction(tenantId);

                await log({
                    message: `Generated cost prediction for tenant ${tenantId}`,
                    details: { tenantId, predictionSummary: prediction?.summary }
                });

                return NextResponse.json({
                    success: true,
                    prediction,
                    correlationId
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_BILLING_PREDICTION', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/billing/prediction', thresholdMs: 1000 });
