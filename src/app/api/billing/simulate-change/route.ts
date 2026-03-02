import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/services/admin/BillingService';
import { handleApiError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { z } from 'zod';
import { PlanTier } from '@/lib/plans';

const SimulateChangeSchema = z.object({
    newTier: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']),
});

/**
 * POST /api/billing/simulate-change
 * Simula el impacto financiero de cambiar de plan (prorrateo).
 * SLA: P95 < 1000ms
 */
export const POST = withPerformanceSLA(async (req: NextRequest) => {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('billing:subscription', 'read');

        const body = await req.json();
        const { newTier } = SimulateChangeSchema.parse(body);

        const tenantId = session.user.tenantId;

        // Llamar al servicio de simulación
        const simulation = await BillingService.simulatePlanChange(tenantId, newTier as PlanTier);

        return NextResponse.json({
            success: true,
            simulation,
            correlationId
        });
    } catch (error) {
        return handleApiError(error, 'API_BILLING_SIMULATE_CHANGE_POST', correlationId);
    }
}, { endpoint: 'POST /api/billing/simulate-change', thresholdMs: 1000 });
