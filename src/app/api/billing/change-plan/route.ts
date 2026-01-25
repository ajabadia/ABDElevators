import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { BillingService } from '@/lib/billing-service';
import { logEvento } from '@/lib/logger';
import { AppError, ValidationError } from '@/lib/errors';
import { z } from 'zod';

const ChangePlanSchema = z.object({
    newPlanSlug: z.string().min(1),
});

/**
 * POST /api/billing/change-plan
 * Cambia el plan de suscripción del tenant actual.
 * Solo accesible por ADMINs del tenant.
 */
export async function POST(req: Request) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
        }

        // Regla: Solo ADMIN puede cambiar el plan
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json({ success: false, message: 'Permisos insuficientes' }, { status: 403 });
        }

        const tenantId = session.user.tenantId;
        const body = await req.json();
        const { newPlanSlug } = ChangePlanSchema.parse(body);

        // Ejecutar cambio de plan
        const result = await BillingService.changePlan(tenantId, newPlanSlug);

        await logEvento({
            nivel: 'INFO',
            origen: 'API_BILLING',
            accion: 'CHANGE_PLAN_SUCCESS',
            mensaje: `Tenant ${tenantId} cambió al plan ${newPlanSlug}`,
            correlacion_id,
            detalles: { tenantId, newPlanSlug, creditApplied: result.creditApplied }
        });

        const duracion = Date.now() - inicio;
        if (duracion > 2000) {
            await logEvento({ nivel: 'WARN', origen: 'API_BILLING', accion: 'SLOW_CHANGE_PLAN', mensaje: 'Cambio de plan lento', correlacion_id, detalles: { duracion } });
        }

        return NextResponse.json({
            success: true,
            plan: newPlanSlug,
            creditApplied: result.creditApplied
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, message: 'Datos inválidos', errors: error.issues }, { status: 400 });
        }

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_BILLING',
            accion: 'CHANGE_PLAN_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });

        return NextResponse.json(
            { success: false, message: error.message || 'Error interno al cambiar el plan' },
            { status: 500 }
        );
    }
}
