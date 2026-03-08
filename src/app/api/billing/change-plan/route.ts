import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/services/admin/BillingService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
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
        const session = await requirePermission('billing:subscription', 'manage');

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
}, { endpoint: 'POST /api/billing/change-plan', thresholdMs: 1000 });
