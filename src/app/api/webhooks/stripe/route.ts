import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { getMongoClient, connectDB } from '@/lib/db';
import { BillingService } from '@/services/admin/BillingService';

/**
 * POST /api/webhooks/stripe
 * Maneja eventos de Stripe con Idempotencia y Atomicidad (FASE 84).
 */
export async function POST(req: NextRequest) {
    const start = Date.now();
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
        return NextResponse.json(
            { error: 'Missing stripe-signature header' },
            { status: 400 }
        );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        throw new AppError('INTERNAL_ERROR', 500, 'STRIPE_WEBHOOK_SECRET not configured');
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        const error = err as Error;
        await logEvento({
            level: 'ERROR',
            source: 'STRIPE_WEBHOOK',
            action: 'SIGNATURE_VERIFICATION_FAILED',
            message: `Webhook signature verification failed: ${error.message}`,
            correlationId: 'stripe-webhook-error',
            stack: error.stack,
        });
        return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    const correlationId = `stripe-${event.id}`;
    const client = await getMongoClient();
    const session = client.startSession();

    try {
        await session.withTransaction(async () => {
            const db = await connectDB();

            // 🛡️ 1. Idempotency Check (processed_webhooks)
            // Usamos 'processed_webhooks' en lugar de 'processed_events' para mayor claridad (FASE 84)
            const webhooks = db.collection('processed_webhooks');

            // Atomic Claim: Intentamos insertar el evento. Si falla por duplicado, retornamos.
            const existing = await webhooks.findOne({ eventId: event.id }, { session });
            if (existing) {
                if (existing.status === 'COMPLETED') {
                    throw new AppError('CONFLICT', 409, 'Event already processed');
                }
                // Si está en 'PROCESSING' pero llegamos aquí, podría ser un reintento legítimo o una carrera.
                // withTransaction manejará el reintento.
            }

            await webhooks.updateOne(
                { eventId: event.id },
                {
                    $setOnInsert: {
                        eventId: event.id,
                        type: event.type,
                        status: 'PROCESSING',
                        createdAt: new Date(),
                        correlationId
                    }
                },
                { upsert: true, session }
            );

            // ⚙️ 2. Business Logic (Delegado a BillingService para atomicidad)
            await BillingService.handleWebhookEvent(event, session);

            // ✅ 3. Success Update
            await webhooks.updateOne(
                { eventId: event.id },
                {
                    $set: {
                        status: 'COMPLETED',
                        processedAt: new Date(),
                        durationMs: Date.now() - start
                    }
                },
                { session }
            );
        });

        return NextResponse.json({ received: true });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        // Manejo especial para duplicados (Idempotencia)
        if (error instanceof AppError && error.code === 'CONFLICT') {
            await logEvento({
                level: 'INFO',
                source: 'STRIPE_WEBHOOK',
                action: 'IDEMPOTENCY_BYPASS',
                message: `Evento Stripe ya procesado: ${event.id}`,
                correlationId,
            });
            return NextResponse.json({ received: true, duplicated: true });
        }

        const durationMs = Date.now() - start;
        await logEvento({
            level: 'ERROR',
            source: 'STRIPE_WEBHOOK',
            action: 'PROCESSING_ERROR',
            message: `Error processing webhook: ${errorMessage}`,
            correlationId,
            details: { durationMs, eventType: event.type },
            stack: errorStack,
        });

        // Intentamos marcar el fallo si la sesión sigue viva (aunque withTransaction aborta, 
        // podríamos registrarlo fuera si es necesario, pero withTransaction es atómico).
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    } finally {
        await session.endSession();
    }
}
