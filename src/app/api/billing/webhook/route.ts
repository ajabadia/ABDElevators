import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/services/admin/BillingService';
import { verifyWebhookSignature } from '@/lib/stripe';
import { handleApiError, AppError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/performance-sla';
import crypto from 'crypto';

/**
 * 💸 Stripe Webhook Endpoint
 * Handles subscription lifecycle events from Stripe.
 * SLA: P95 < 300ms
 */
export const POST = withPerformanceSLA(async (req: NextRequest) => {
    const correlationId = crypto.randomUUID();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
        throw new AppError('BAD_REQUEST', 400, 'Missing stripe-signature');
    }

    try {
        const payload = await req.text();
        const event = verifyWebhookSignature(payload, signature);

        // Delegate to BillingService for persistent logic
        await BillingService.handleWebhookEvent(event);

        return NextResponse.json({
            received: true,
            correlationId
        });
    } catch (error) {
        return handleApiError(error, 'API_STRIPE_WEBHOOK_POST', correlationId);
    }
}, { p95: 300, max: 1000 });

// Ensure raw body is preserved (though in App Router we use req.text() above)
export const config = {
    api: {
        bodyParser: false,
    },
};
