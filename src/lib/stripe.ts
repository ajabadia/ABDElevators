import Stripe from 'stripe';
import { PLANS, PlanTier } from './plans';

const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE?.includes('build')) {
        throw new Error('STRIPE_SECRET_KEY is missing');
    } else {
        console.warn('⚠️ [STRIPE] Secret Key no configurado. Las funcionalidades de pago estarán desactivadas.');
    }
}

export const stripe = new Stripe(stripeKey || 'sk_test_dummy', {
    apiVersion: '2025-01-27' as any,
    appInfo: {
        name: 'ABDElevators RAG Platform',
        version: '4.1.0',
    },
});

/**
 * Crea una sesión de Checkout para suscripción.
 */
interface CreateCheckoutOptions {
    tenantId: string;
    tier?: PlanTier;
    priceId?: string;
    customerId?: string; // Optional, if we have it
    successUrl: string;
    cancelUrl: string;
    billingPeriod?: 'monthly' | 'yearly';
}

/**
 * Crea una sesión de Checkout para suscripción.
 * Supports both Tier-based (lookup) and PriceID-based logic.
 */
export async function createCheckoutSession(options: CreateCheckoutOptions) {
    const { tenantId, tier, priceId, customerId, successUrl, cancelUrl } = options;

    let targetPriceId = priceId;

    if (!targetPriceId && tier) {
        const plan = PLANS[tier];
        targetPriceId = plan.stripePriceId;
    }

    if (!targetPriceId) {
        throw new Error(`Cannot create checkout: Missing Price ID or valid Tier`);
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
            {
                price: targetPriceId,
                quantity: 1,
            },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
            tenantId,
            tier: tier || '',
        },
        subscription_data: {
            metadata: {
                tenantId,
            },
        },
    };

    if (customerId) {
        sessionParams.customer = customerId;
    }

    return await stripe.checkout.sessions.create(sessionParams);
}

// Helper to get or create customer (Moved logic here or keeping it separate is fine)
export async function getOrCreateStripeCustomer(tenantId: string, email: string, name: string) {
    // Check if exists logic (simplified for now as it wasn't requested in this specific change, 
    // but verifying existing export exists/is correct is good practice. 
    // Assuming getOrCreateStripeCustomer was already imported in route.ts but not visible in view_file 1-74 range 
    // or needs to be added.)

    // For now, I will assume getOrCreateStripeCustomer exists below line 74 or add it if missing.
    // The view_file 7101 showed up to line 74 and verifyWebhookSignature was last.
    // So getOrCreateStripeCustomer is MISSING in stripe.ts or I missed it.
    // I need to add it.

    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) return existing.data[0].id;

    const newCustomer = await stripe.customers.create({
        email,
        name,
        metadata: { tenantId }
    });
    return newCustomer.id;
}

/**
 * Crea una sesión para el Portal de Cliente de Stripe.
 */
export async function createPortalSession(customerId: string, returnUrl: string) {
    return await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });
}

/**
 * Verifica la firma del webhook de Stripe.
 */
export function verifyWebhookSignature(payload: string, signature: string) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is missing');
    }

    return stripe.webhooks.constructEvent(payload, signature, secret);
}
