import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/services/admin/BillingService';
import { handleApiError, ValidationError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { z } from 'zod';
import { PLANS } from '@/lib/plans';
import { withCorrelation } from '@/lib/logger/with-correlation';

const CreateCheckoutSchema = z.object({
    priceId: z.string().min(1),
    billingPeriod: z.enum(['monthly', 'yearly']),
});

/**
 * POST /api/billing/create-checkout
 * Inicia el flujo de pago de Stripe
 * SLA: P95 < 2000ms
 */
export const POST = withPerformanceSLA(async (req: NextRequest) =>
    withCorrelation(
        { level: 'INFO', source: 'APIBILLINGCHECKOUT', action: 'CREATECHECKOUT' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('billing:subscription', 'manage');

                const body = await req.json();
                const { priceId } = CreateCheckoutSchema.parse(body);

                const tenantId = session.user.tenantId;
                const email = session.user.email;

                if (!email) {
                    throw new ValidationError('El usuario no tiene una dirección de email asociada');
                }

                // Find tier by priceId
                const tier = Object.values(PLANS).find(p => p.stripePriceId === priceId)?.tier;
                if (!tier) {
                    throw new ValidationError(`Price ID no reconocido: ${priceId}`);
                }

                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                const { url } = await BillingService.startSubscriptionFlow(
                    tenantId,
                    tier,
                    email,
                    `${baseUrl}/admin/billing`
                );

                await log({
                    message: 'Stripe checkout created',
                    details: {
                        tenantId,
                        userId: session.user.id,
                        tier,
                        priceId
                    }
                });

                return NextResponse.json({
                    success: true,
                    checkoutUrl: url,
                    correlationId
                });
            } catch (error) {
                return handleApiError(error, 'APIBILLINGCHECKOUT', correlationId);
            }
        }
    ),
    { endpoint: 'POST /api/billing/create-checkout', thresholdMs: 2000 }
);
