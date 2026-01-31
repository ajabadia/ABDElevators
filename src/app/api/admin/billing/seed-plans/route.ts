import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AppError, handleApiError } from '@/lib/errors';
import { BillingService } from '@/lib/billing-service';
import { logEvento } from '@/lib/logger';

/**
 * POST /api/admin/billing/seed-plans
 * Inicializa la oferta comercial (Standard, Pro, Premium, Ultra)
 * Solo ejecutable por SUPER_ADMIN.
 */
export async function POST(req: Request) {
    const correlacion_id = crypto.randomUUID();

    try {
        const session = await auth();

        // Verificación estricta de SuperAdmin
        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            throw new AppError('FORBIDDEN', 403, 'Solo el SuperAdmin puede inicializar planes comerciales');
        }

        const result = await BillingService.seedDefaultPlans();

        await logEvento({
            level: 'INFO',
            source: 'ADMIN_BILLING',
            action: 'SEED_PLANS_SUCCESS',
            message: `Planes comerciales inicializados exitosamente por ${session.user.email}`, correlationId: correlacion_id,
            details: { insertedCount: result.insertedCount }
        });

        return NextResponse.json({
            success: true,
            message: 'Planes comerciales inicializados correctamente',
            plansCount: result.insertedCount
        });

    } catch (error: any) {
        return handleApiError(error, 'ADMIN_BILLING', correlacion_id);
    }
}
