import { stripe, createCheckoutSession } from '../lib/stripe';
import { TenantService } from '../lib/tenant-service';
import { logEvento } from '../lib/logger';
import { AppError } from '../lib/errors';
import { TenantSubscription } from '../lib/schemas/billing';
import Stripe from 'stripe';

/**
 * 💸 BillingService: Orquestación de Stripe y Procesamiento de Webhooks (Phase 120.2)
 */
export class BillingService {

    /**
     * Inicia el flujo de suscripción para un tenant.
     */
    static async startSubscriptionFlow(tenantId: string, tier: string, email: string, returnUrl: string) {
        const correlationId = crypto.randomUUID();

        try {
            const config = await TenantService.getConfig(tenantId);
            const customerId = (config.subscription as TenantSubscription)?.stripeCustomerId;

            const session = await createCheckoutSession({
                tenantId,
                tier: tier as any,
                customerId,
                successUrl: `${process.env.NEXTAUTH_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${process.env.NEXTAUTH_URL}/billing`,
            });

            return { url: session.url };
        } catch (error: any) {
            await logEvento({
                level: 'ERROR',
                source: 'BILLING_SERVICE',
                action: 'START_SUB_FLOW_ERROR',
                correlationId,
                message: error.message,
                details: { tenantId, tier }
            });
            throw new AppError('EXTERNAL_SERVICE_ERROR', 503, 'Could not initiate checkout');
        }
    }

    /**
     * Procesa eventos de Stripe (Webhooks).
     */
    static async handleWebhookEvent(event: Stripe.Event) {
        const correlationId = crypto.randomUUID();

        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, correlationId);
                break;
            case 'invoice.paid':
                await this.handleInvoicePaid(event.data.object as Stripe.Invoice, correlationId);
                break;
            case 'invoice.payment_failed':
                await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, correlationId);
                break;
            case 'customer.subscription.deleted':
                await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription, correlationId);
                break;
            default:
                // Evento no manejado
                break;
        }
    }

    private static async handleCheckoutCompleted(session: Stripe.Checkout.Session, correlationId: string) {
        const tenantId = session.metadata?.tenantId;
        if (!tenantId) return;

        await TenantService.updateConfig(tenantId, {
            'subscription.stripeCustomerId': session.customer as string,
            'subscription.stripeSubscriptionId': session.subscription as string,
            'subscription.status': 'active',
            'subscription.updatedAt': new Date()
        }, { performedBy: 'STRIPE_WEBHOOK', correlationId });
    }

    private static async handleInvoicePaid(invoice: Stripe.Invoice, correlationId: string) {
        const inv = invoice as any;
        if (!inv.subscription) return;
        const subscriptionId = typeof inv.subscription === 'string' ? inv.subscription : inv.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const tenantId = (subscription.metadata as any).tenantId;
        if (!tenantId) return;

        await TenantService.updateConfig(tenantId, {
            'subscription.status': 'active',
            'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
            'subscription.updatedAt': new Date()
        }, { performedBy: 'STRIPE_WEBHOOK', correlationId });
    }

    private static async handleInvoicePaymentFailed(invoice: Stripe.Invoice, correlationId: string) {
        const inv = invoice as any;
        if (!inv.subscription) return;
        const subscriptionId = typeof inv.subscription === 'string' ? inv.subscription : inv.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const tenantId = (subscription.metadata as any).tenantId;
        if (!tenantId) return;

        await TenantService.updateConfig(tenantId, {
            'subscription.status': 'past_due',
            'subscription.updatedAt': new Date()
        }, { performedBy: 'STRIPE_WEBHOOK', correlationId });

        await logEvento({
            level: 'WARN',
            source: 'BILLING_SERVICE',
            action: 'PAYMENT_FAILED',
            correlationId,
            message: `Payment failed for tenant ${tenantId}`,
            details: { invoiceId: invoice.id }
        });
    }

    private static async handleSubscriptionDeleted(subscription: Stripe.Subscription, correlationId: string) {
        const tenantId = subscription.metadata.tenantId;
        if (!tenantId) return;

        await TenantService.updateConfig(tenantId, {
            'subscription.status': 'canceled',
            'subscription.updatedAt': new Date()
        }, { performedBy: 'STRIPE_WEBHOOK', correlationId });
    }
}
