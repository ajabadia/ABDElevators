import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/services/admin/BillingService';
import { handleApiError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { withPerformanceSLA } from '@/lib/performance-sla';
import crypto from 'crypto';
import { z } from 'zod';

const ChangePlanSchema = z.object({
    newPlanSlug: z.string().min(1),
});

/**
 * POST /api/billing/change-plan
 * Cambia el plan del tenant
 * SLA: P95 < 1000ms
 */
export const POST = withPerformanceSLA(async (req: NextRequest) => {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('billing:subscription', 'manage');

        const body = await req.json();
        const { newPlanSlug } = ChangePlanSchema.parse(body);

        const tenantId = session.user.tenantId;

        const result = await BillingService.changePlan(tenantId, newPlanSlug);

        return NextResponse.json({
            success: true,
            plan: newPlanSlug,
            creditApplied: result.creditApplied,
            correlationId
        });
    } catch (error) {
        return handleApiError(error, 'API_BILLING_CHANGE_PLAN_POST', correlationId);
    }
}, { p95: 1000, max: 3000 });
