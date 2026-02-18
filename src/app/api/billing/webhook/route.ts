import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/stripe';
import { BillingService } from '@/lib/billing-service';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';

/**
 * 💸 Stripe Webhook Endpoint
 * Handles subscription lifecycle events from Stripe.
 * SECURE: Verifies Stripe signature before processing.
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
    }

    try {
        const payload = await req.text();
        const event = verifyWebhookSignature(payload, signature);

        await logEvento({
            level: 'INFO',
            source: 'STRIPE_WEBHOOK',
            action: 'EVENT_RECEIVED',
            correlationId,
            message: `Stripe event received: ${event.type}`,
            details: { eventId: event.id }
        });

        // Delegate to BillingService for persistent logic
        await BillingService.handleWebhookEvent(event);

        return NextResponse.json({ received: true });

    } catch (error: any) {
        await logEvento({
            level: 'ERROR',
            source: 'STRIPE_WEBHOOK',
            action: 'WEBHOOK_ERROR',
            correlationId,
            message: error.message,
            stack: error.stack
        });

        return NextResponse.json(
            { error: `Webhook Error: ${error.message}` },
            { status: 400 }
        );
    }
}

// Ensure raw body is preserved (though in App Router we use req.text() above)
export const config = {
    api: {
        bodyParser: false,
    },
};
