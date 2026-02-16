import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

/**
 * Obtiene la instancia de Stripe (lazy initialization)
 * Singleton para reutilizar la conexión
 */
export function getStripe(): Stripe {
    if (!stripeInstance) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
        }

        stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-12-15.clover',
            typescript: true,
        });
    }

    return stripeInstance;
}

// Export para compatibilidad con código existente
export const stripe = new Proxy({} as Stripe, {
    get: (target, prop) => {
        const instance = getStripe();
        return (instance as any)[prop];
    }
});

/**
 * IDs de productos de Stripe (configurar en Stripe Dashboard)
 * IMPORTANTE: Reemplazar estos valores con los IDs reales de tu cuenta Stripe
 */
export const STRIPE_PRODUCTS = {
    FREE: {
        // Free no tiene producto en Stripe (es gratuito)
        price_id_monthly: null,
        price_id_yearly: null,
    },
    PRO: {
        // Reemplazar con tus IDs reales de Stripe
        price_id_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly_placeholder',
        price_id_yearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly_placeholder',
    },
    ENTERPRISE: {
        // Reemplazar con tus IDs reales de Stripe
        price_id_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly_placeholder',
        price_id_yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_enterprise_yearly_placeholder',
    },
};

/**
 * Crea o recupera un customer de Stripe para un tenant
 */
export async function getOrCreateStripeCustomer(
    tenantId: string,
    email: string,
    name: string
): Promise<string> {
    // Buscar si ya existe un customer con este metadata
    const existingCustomers = await stripe.customers.list({
        email,
        limit: 1,
    });

    if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0].id;
    }

    // Crear nuevo customer
    const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
            tenantId,
        },
    });

    return customer.id;
}

/**
 * Crea una sesión de Checkout de Stripe
 */
export async function createCheckoutSession(params: {
    customerId: string;
    priceId: string;
    tenantId: string;
    successUrl: string;
    cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
    const { customerId, priceId, tenantId, successUrl, cancelUrl } = params;

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
            tenantId,
        },
        subscription_data: {
            metadata: {
                tenantId,
            },
        },
    });

    return session;
}

/**
 * Crea un portal de gestión de suscripción
 */
export async function createBillingPortalSession(
    customerId: string,
    returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });

    return session;
}

/**
 * Cancela una suscripción
 */
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Obtiene los detalles de una suscripción
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.retrieve(subscriptionId);
}
