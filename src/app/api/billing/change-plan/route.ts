import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { BillingService } from '@/services/admin/BillingService';
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
            level: 'INFO',
            source: 'API_BILLING',
            action: 'CHANGE_PLAN_SUCCESS',
            message: `Tenant ${tenantId} cambió al plan ${newPlanSlug}`, correlationId: correlacion_id,
            details: { tenantId, newPlanSlug, creditApplied: result.creditApplied }
        });

        const duracion = Date.now() - inicio;
        if (duracion > 2000) {
            await logEvento({ level: 'WARN', source: 'API_BILLING', action: 'SLOW_CHANGE_PLAN', message: 'Cambio de plan lento', correlationId: correlacion_id, details: { duracion } });
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
            level: 'ERROR',
            source: 'API_BILLING',
            action: 'CHANGE_PLAN_ERROR',
            message: error.message, correlationId: correlacion_id,
            stack: error.stack
        });

        return NextResponse.json(
            { success: false, message: error.message || 'Error interno al cambiar el plan' },
            { status: 500 }
        );
    }
}
