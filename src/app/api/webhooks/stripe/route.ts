import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { TenantService } from '@/lib/tenant-service';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { PlanTier } from '@/lib/plans';
import { sendPaymentFailedEmail } from '@/lib/email-service';
import { connectDB, connectAuthDB } from '@/lib/db';

/**
 * POST /api/webhooks/stripe
 * Maneja eventos de Stripe (subscription.created, payment.succeeded, etc.)
 * 
 * IMPORTANTE: Configurar en Stripe Dashboard:
 * - URL: https://tu-dominio.com/api/webhooks/stripe
 * - Eventos: customer.subscription.created, customer.subscription.updated, 
 *           customer.subscription.deleted, invoice.payment_succeeded, invoice.payment_failed
 */
export async function POST(req: NextRequest) {
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
            nivel: 'ERROR',
            origen: 'STRIPE_WEBHOOK',
            accion: 'SIGNATURE_VERIFICATION_FAILED',
            mensaje: `Webhook signature verification failed: ${error.message}`,
            correlacion_id: 'stripe-webhook-error',
            stack: error.stack,
        });
        return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    const correlacion_id = `stripe-${event.id}`;

    try {
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionUpdate(event.data.object as Stripe.Subscription, correlacion_id);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, correlacion_id);
                break;

            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object as Stripe.Invoice, correlacion_id);
                break;

            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object as Stripe.Invoice, correlacion_id);
                break;

            default:
                await logEvento({
                    nivel: 'DEBUG',
                    origen: 'STRIPE_WEBHOOK',
                    accion: 'UNHANDLED_EVENT',
                    mensaje: `Unhandled event type: ${event.type}`,
                    correlacion_id,
                });
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        const err = error as Error;
        await logEvento({
            nivel: 'ERROR',
            origen: 'STRIPE_WEBHOOK',
            accion: 'PROCESSING_ERROR',
            mensaje: `Error processing webhook: ${err.message}`,
            correlacion_id,
            stack: err.stack,
        });
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}

/**
 * Maneja creación/actualización de suscripción
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription, correlacion_id: string) {
    const tenantId = subscription.metadata.tenantId;
    if (!tenantId) {
        throw new Error('Missing tenantId in subscription metadata');
    }

    // Determinar tier basado en el price_id
    const priceId = subscription.items.data[0]?.price.id;
    const tier = getTierFromPriceId(priceId);

    await TenantService.updateConfig(tenantId, {
        subscription: {
            tier,
            status: subscription.status === 'active' ? 'ACTIVE' : 'SUSPENDED',
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            current_period_start: new Date((subscription as any).current_period_start * 1000),
            current_period_end: new Date((subscription as any).current_period_end * 1000),
        },
    });

    await logEvento({
        nivel: 'INFO',
        origen: 'STRIPE_WEBHOOK',
        accion: 'SUBSCRIPTION_UPDATED',
        mensaje: `Subscription updated for tenant ${tenantId} to tier ${tier}`,
        correlacion_id,
        detalles: {
            tenantId,
            tier,
            status: subscription.status,
            subscriptionId: subscription.id,
        },
    });
}

/**
 * Maneja cancelación de suscripción
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription, correlacion_id: string) {
    const tenantId = subscription.metadata.tenantId;
    if (!tenantId) {
        throw new Error('Missing tenantId in subscription metadata');
    }

    await TenantService.updateConfig(tenantId, {
        subscription: {
            tier: 'FREE',
            status: 'CANCELLED',
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
        },
    });

    await logEvento({
        nivel: 'WARN',
        origen: 'STRIPE_WEBHOOK',
        accion: 'SUBSCRIPTION_CANCELLED',
        mensaje: `Subscription cancelled for tenant ${tenantId}, downgraded to FREE`,
        correlacion_id,
        detalles: { tenantId, subscriptionId: subscription.id },
    });
}

/**
 * Maneja pago exitoso
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice, correlacion_id: string) {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id || '';
    const subscriptionId = typeof (invoice as any).subscription === 'string' ? (invoice as any).subscription : (invoice as any).subscription?.id || '';

    await logEvento({
        nivel: 'INFO',
        origen: 'STRIPE_WEBHOOK',
        accion: 'PAYMENT_SUCCEEDED',
        mensaje: `Payment succeeded for customer ${customerId}`,
        correlacion_id,
        detalles: {
            customerId,
            subscriptionId,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
        },
    });
}

/**
 * Maneja pago fallido
 */
async function handlePaymentFailed(invoice: Stripe.Invoice, correlacion_id: string) {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id || '';
    const subscriptionId = typeof (invoice as any).subscription === 'string' ? (invoice as any).subscription : (invoice as any).subscription?.id || '';

    await logEvento({
        nivel: 'ERROR',
        origen: 'STRIPE_WEBHOOK',
        accion: 'PAYMENT_FAILED',
        mensaje: `Payment failed for customer ${customerId}`,
        correlacion_id,
        detalles: {
            customerId,
            subscriptionId,
            amount: invoice.amount_due / 100,
            currency: invoice.currency,
        },
    });

    // Enviar email de notificación al tenant
    try {
        const authDb = await connectAuthDB();
        const mainDb = await connectDB(); // Para logs si fuera necesario, pero usemos auth para identidad

        // Buscar tenant por stripe_customer_id
        const tenant = await authDb.collection('tenants').findOne({
            'subscription.stripe_customer_id': customerId
        });

        if (tenant) {
            // Buscar admin del tenant
            const admin = await authDb.collection('users').findOne({
                tenantId: tenant.tenantId,
                role: 'ADMIN'
            });

            if (admin?.email) {
                // Contar intentos fallidos
                const failedPayments = await authDb.collection('logs').countDocuments({
                    origen: 'STRIPE_WEBHOOK',
                    accion: 'PAYMENT_FAILED',
                    'detalles.customerId': customerId,
                    timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Últimos 30 días
                });

                await sendPaymentFailedEmail({
                    to: admin.email,
                    tenantName: tenant.name || 'Tu Organización',
                    amount: invoice.amount_due / 100,
                    currency: invoice.currency,
                    attemptCount: failedPayments + 1,
                });

                // Suspender cuenta si es el 3er intento fallido
                if (failedPayments >= 2) {
                    await authDb.collection('tenants').updateOne(
                        { tenantId: tenant.tenantId },
                        {
                            $set: {
                                'subscription.status': 'SUSPENDED',
                                'active': false
                            }
                        }
                    );

                    await logEvento({
                        nivel: 'ERROR',
                        origen: 'STRIPE_WEBHOOK',
                        accion: 'ACCOUNT_SUSPENDED',
                        mensaje: `Cuenta suspendida por 3 pagos fallidos: ${tenant.tenantId}`,
                        correlacion_id,
                        detalles: { tenantId: tenant.tenantId, failedPayments: failedPayments + 1 },
                    });
                }
            }
        }
    } catch (error) {
        await logEvento({
            nivel: 'ERROR',
            origen: 'STRIPE_WEBHOOK',
            accion: 'EMAIL_FAILED',
            mensaje: `Error enviando email de pago fallido: ${(error as Error).message}`,
            correlacion_id,
            stack: (error as Error).stack,
        });
    }
}

/**
 * Determina el tier basado en el price_id de Stripe
 */
function getTierFromPriceId(priceId: string): PlanTier {
    const proPrices = [
        process.env.STRIPE_PRICE_PRO_MONTHLY,
        process.env.STRIPE_PRICE_PRO_YEARLY,
    ];
    const enterprisePrices = [
        process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
        process.env.STRIPE_PRICE_ENTERPRISE_YEARLY,
    ];

    if (proPrices.includes(priceId)) return 'PRO';
    if (enterprisePrices.includes(priceId)) return 'ENTERPRISE';
    return 'FREE';
}
