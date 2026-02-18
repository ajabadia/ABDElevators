import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AppError, handleApiError } from '@/lib/errors';
import { UsageService } from '@/lib/usage-service';
import crypto from 'crypto';

/**
 * 📈 Tenant Prediction API (Phase 110)
 * Provides cost projections based on actual usage for the Simulator.
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'Debes iniciar sesión');
        }

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

    } catch (error) {
        return handleApiError(error, 'API_BILLING_PREDICTION', correlationId);
    }
}
