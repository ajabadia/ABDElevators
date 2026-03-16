import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { AppError, handleApiError } from '@/lib/errors';
import { BillingService } from '@/services/admin/BillingService';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/admin/billing/seed-plans
 * Inicializa la oferta comercial (Standard, Pro, Premium, Ultra)
 * Solo ejecutable por SUPER_ADMIN.
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'ADMIN_BILLING', action: 'SEED_PLANS' },
        async ({ log, correlationId }) => {
            try {
                // 🛡️ FASE 304: Shielding with Internal Secret (Bank-Grade Security)
                const internalSecret = req.headers.get('x-internal-api-secret');
                if (process.env.INTERNAL_API_SECRET && internalSecret !== process.env.INTERNAL_API_SECRET) {
                    throw new AppError('SECURITY_ERROR', 403, 'Forbidden: Invalid Internal API Secret');
                }

                const session = await requirePermission('platform:billing', 'manage');

                const result = await BillingService.seedDefaultPlans() as any;

                await log({
                    message: `Planes comerciales inicializados exitosamente por ${session.user.email}`,
                    details: { insertedCount: result.insertedCount }
                });

                return NextResponse.json({
                    success: true,
                    message: 'Planes comerciales inicializados correctamente',
                    plansCount: result.insertedCount
                });

            } catch (error: unknown) {
                return handleApiError(error, 'ADMIN_BILLING_SEED', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/billing/seed-plans', thresholdMs: 1000 });
