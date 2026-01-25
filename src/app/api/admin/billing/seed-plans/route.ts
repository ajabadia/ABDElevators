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
            nivel: 'INFO',
            origen: 'ADMIN_BILLING',
            accion: 'SEED_PLANS_SUCCESS',
            mensaje: `Planes comerciales inicializados exitosamente por ${session.user.email}`,
            correlacion_id,
            detalles: { insertedCount: result.insertedCount }
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
