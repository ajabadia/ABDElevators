import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { BillingService } from '@/services/admin/BillingService';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { z } from 'zod';
import { PlanTier } from '@/lib/plans';

const SimulateChangeSchema = z.object({
    newTier: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']),
});

/**
 * POST /api/billing/simulate-change
 * Simula el impacto financiero de cambiar de plan (prorrateo).
 */
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const tenantId = session.user.tenantId;
        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID no encontrado en la sesión');
        }

        const body = await req.json();
        const { newTier } = SimulateChangeSchema.parse(body);

        // Llamar al servicio de simulación
        const simulation = await BillingService.simulatePlanChange(tenantId, newTier as PlanTier);

        await logEvento({
            level: 'INFO',
            source: 'BILLING_API',
            action: 'PLAN_CHANGE_SIMULATED',
            message: `Plan change simulated for tenant ${tenantId} to ${newTier}`,
            correlationId: correlacion_id,
            details: {
                tenantId,
                newTier,
                simulation
            },
        });

        return NextResponse.json({
            success: true,
            simulation
        });
    } catch (error: any) {
        await logEvento({
            level: 'ERROR',
            source: 'BILLING_API',
            action: 'SIMULATION_ERROR',
            message: `Error simulating plan change: ${error.message}`,
            correlationId: correlacion_id,
            stack: error.stack,
        });

        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, error.message).toJSON(),
            { status: 500 }
        );
    }
}
