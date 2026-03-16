import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/services/admin/BillingService';
import { verifyWebhookSignature } from '@/lib/stripe';
import { handleApiError, AppError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { withCorrelation } from '@/lib/logger/with-correlation';

export const POST = withPerformanceSLA(async (req: NextRequest) =>
    withCorrelation(
        { level: 'INFO', source: 'APIBILLINGWEBHOOK', action: 'HANDLEWEBHOOK' },
        async ({ log, correlationId }) => {
            try {
                const signature = req.headers.get('stripe-signature');
                if (!signature) throw new AppError('BAD_REQUEST', 400, 'Missing signature');

                const payload = await req.text();
                const event = verifyWebhookSignature(payload, signature);

                await BillingService.handleWebhookEvent(event);

                await log({
                    message: 'Stripe webhook event processed',
                    details: { eventType: event.type }
                });

                return NextResponse.json({ received: true, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'APIBILLINGWEBHOOK', correlationId);
            }
        }
    ),
    { endpoint: 'POST /api/billing/webhook', thresholdMs: 1000 }
);
