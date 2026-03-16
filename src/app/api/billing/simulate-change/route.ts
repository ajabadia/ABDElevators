import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/services/admin/BillingService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { z } from 'zod';
import { PlanTier } from '@/lib/plans';
import { withCorrelation } from '@/lib/logger/with-correlation';

const SimulateChangeSchema = z.object({
    newTier: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']),
});

/**
 * POST /api/billing/simulate-change
 * Simula el impacto financiero de cambiar de plan (prorrateo).
 * SLA: P95 < 1000ms
 */
export const POST = withPerformanceSLA(async (req: NextRequest) =>
    withCorrelation(
        { level: 'INFO', source: 'APIBILLINGSIMULATECHANGE', action: 'SIMULATEPLANCHANGE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('billing:subscription', 'read');

                const body = await req.json();
                const { newTier } = SimulateChangeSchema.parse(body);

                const tenantId = session.user.tenantId;

                // Llamar al servicio de simulación
                const simulation = await BillingService.simulatePlanChange(tenantId, newTier as PlanTier);

                await log({
                    message: 'Plan change simulation performed',
                    details: {
                        tenantId,
                        userId: session.user.id,
                        newTier
                    }
                });

                return NextResponse.json({
                    success: true,
                    simulation,
                    correlationId
                });
            } catch (error) {
                return handleApiError(error, 'APIBILLINGSIMULATECHANGE', correlationId);
            }
        }
    ),
    { endpoint: 'POST /api/billing/simulate-change', thresholdMs: 1000 }
);
