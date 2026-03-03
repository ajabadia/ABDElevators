import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { logEvento } from '@/lib/logger';
import { AppError, handleApiError } from '@/lib/errors';
import { getMongoClient, connectDB } from '@/lib/db';
import { BillingService } from '@/services/admin/BillingService';

async function POST_internal(req: NextRequest) {
    const start = Date.now();
    const correlationId = `stripe-hook-${Date.now()}`;
    try {
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');
        if (!signature) throw new AppError('BAD_REQUEST', 400, 'Missing signature');

        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) throw new AppError('INTERNAL_ERROR', 500, 'Secret not configured');

        const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        const client = await getMongoClient();
        const session = client.startSession();

        try {
            await session.withTransaction(async () => {
                const db = await connectDB();
                const webhooks = db.collection('processed_webhooks');
                const existing = await webhooks.findOne({ eventId: event.id }, { session });
                if (existing?.status === 'COMPLETED') throw new AppError('CONFLICT', 409, 'Event processed');

                await webhooks.updateOne({ eventId: event.id }, { $setOnInsert: { eventId: event.id, type: event.type, status: 'PROCESSING', createdAt: new Date() } }, { upsert: true, session });
                await BillingService.handleWebhookEvent(event, session);
                await webhooks.updateOne({ eventId: event.id }, { $set: { status: 'COMPLETED', processedAt: new Date(), durationMs: Date.now() - start } }, { session });
            });
        } finally {
            await session.endSession();
        }

        return NextResponse.json({ received: true });
    } catch (error: unknown) {
        return handleApiError(error, 'STRIPE_WEBHOOK', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/webhooks/stripe', thresholdMs: 1000 });
