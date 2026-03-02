import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { AppError, handleApiError } from '@/lib/errors';
import { UsageService } from '@/services/ops/usage-service';

/**
 * 📈 Tenant Prediction API (Phase 110)
 * Provides cost projections based on actual usage for the Simulator.
 */
async function GET_internal (req: NextRequest) {
    const correlationId = crypto.randomUUID();

    try {
        const session = await enforcePermission('billing:prediction', 'read');
        const tenantId = session.user.tenantId;

        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'No tienes un tenant asignado');
        }

        // 1. Obtener predicción basada en uso real
        const prediction = await UsageService.getTenantCostPrediction(tenantId);

        return NextResponse.json({
            success: true,
            prediction,
            correlationId
        });

    } catch (error: unknown) {
        return handleApiError(error, 'API_BILLING_PREDICTION', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/billing/prediction', thresholdMs: 1000 });
