import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/services/admin/BillingService';
import { verifyWebhookSignature } from '@/lib/stripe';
import { handleApiError, AppError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';

async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const signature = req.headers.get('stripe-signature');
        if (!signature) throw new AppError('BAD_REQUEST', 400, 'Missing signature');

        const payload = await req.text();
        const event = verifyWebhookSignature(payload, signature);

        await BillingService.handleWebhookEvent(event);
        return NextResponse.json({ received: true, correlationId });
    } catch (error: unknown) {
        return handleApiError(error, 'API_BILLING_WEBHOOK', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/billing/webhook', thresholdMs: 1000 });
