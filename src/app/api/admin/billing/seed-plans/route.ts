import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { AppError, handleApiError } from '@/lib/errors';
import { BillingService } from '@/services/admin/BillingService';
import { logEvento } from '@/lib/logger';

/**
 * POST /api/admin/billing/seed-plans
 * Inicializa la oferta comercial (Standard, Pro, Premium, Ultra)
 * Solo ejecutable por SUPER_ADMIN.
 */
async function POST_internal(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();

    try {
        // 🛡️ FASE 304: Shielding with Internal Secret (Bank-Grade Security)
        const internalSecret = req.headers.get('x-internal-api-secret');
        if (process.env.INTERNAL_API_SECRET && internalSecret !== process.env.INTERNAL_API_SECRET) {
            throw new AppError('SECURITY_ERROR', 403, 'Forbidden: Invalid Internal API Secret');
        }

        const session = await enforcePermission('platform:billing', 'manage');

        const result = await BillingService.seedDefaultPlans() as any;

        await logEvento({
            level: 'INFO',
            source: 'ADMIN_BILLING',
            action: 'SEED_PLANS_SUCCESS',
            message: `Planes comerciales inicializados exitosamente por ${session.user.email}`,
            correlationId: correlacion_id,
            details: { insertedCount: result.insertedCount }
        });

        return NextResponse.json({
            success: true,
            message: 'Planes comerciales inicializados correctamente',
            plansCount: result.insertedCount
        });

    } catch (error: unknown) {
        return handleApiError(error, 'ADMIN_BILLING', correlacion_id);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/billing/seed-plans', thresholdMs: 1000 });
