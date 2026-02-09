import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/stripe';
import { TenantService } from '@/lib/tenant-service';
import { logEvento } from '@/lib/logger';
import { PlanTier } from '@/lib/plans';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
    const payload = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    let event: Stripe.Event;

    try {
        event = verifyWebhookSignature(payload, signature);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const correlationId = `stripe-webhook-${event.id}`;

    await logEvento({
        level: 'INFO',
        source: 'STRIPE_WEBHOOK',
        action: event.type,
        message: `Stripe webhook received: ${event.type}`,
        correlationId,
        details: { eventId: event.id }
    });

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const tenantId = session.metadata?.tenantId;
                const tier = session.metadata?.tier as PlanTier;
                const customerId = session.customer as string;

                if (tenantId && tier) {
                    await TenantService.updateConfig(tenantId, {
                        subscription: {
                            tier,
                            stripeCustomerId: customerId,
                            stripeSubscriptionId: session.subscription as string,
                            status: 'active',
                            updatedAt: new Date()
                        }
                    }, {
                        performedBy: 'STRIPE_WEBHOOK',
                        correlationId
                    });

                    await logEvento({
                        level: 'INFO',
                        source: 'STRIPE_WEBHOOK',
                        action: 'SUBSCRIPTION_CREATED',
                        message: `Subscription created for tenant ${tenantId}: Tier ${tier}`,
                        correlationId,
                        details: { tenantId, tier, customerId }
                    });
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const tenantId = subscription.metadata?.tenantId;

                if (tenantId) {
                    // Mapear status de Stripe a nuestro status (simplificado)
                    const status = subscription.status === 'active' ? 'active' : 'past_due';

                    await TenantService.updateConfig(tenantId, {
                        'subscription.status': status,
                        'subscription.updatedAt': new Date()
                    }, {
                        performedBy: 'STRIPE_WEBHOOK',
                        correlationId
                    });
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const tenantId = subscription.metadata?.tenantId;

                if (tenantId) {
                    await TenantService.updateConfig(tenantId, {
                        subscription: {
                            tier: 'FREE', // Downgrade a Free al cancelar
                            status: 'canceled',
                            updatedAt: new Date()
                        }
                    }, {
                        performedBy: 'STRIPE_WEBHOOK',
                        correlationId
                    });

                    await logEvento({
                        level: 'WARN',
                        source: 'STRIPE_WEBHOOK',
                        action: 'SUBSCRIPTION_CANCELED',
                        message: `Subscription canceled for tenant ${tenantId}. Downgraded to FREE.`,
                        correlationId,
                        details: { tenantId }
                    });
                }
                break;
            }

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        await logEvento({
            level: 'ERROR',
            source: 'STRIPE_WEBHOOK',
            action: 'WEBHOOK_ERROR',
            message: `Error processing Stripe webhook: ${error.message}`,
            correlationId,
            stack: error.stack
        });
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
