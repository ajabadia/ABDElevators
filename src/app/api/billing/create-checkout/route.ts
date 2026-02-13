import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createCheckoutSession, getOrCreateStripeCustomer } from '@/lib/stripe';
import { TenantService } from '@/lib/tenant-service';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { z } from 'zod';

const CreateCheckoutSchema = z.object({
    priceId: z.string().min(1),
    billingPeriod: z.enum(['monthly', 'yearly']),
});

/**
 * POST /api/billing/create-checkout
 * Crea una sesión de Stripe Checkout para upgrade de plan
 */
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const tenantId = session.user.tenantId;
        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID no encontrado en la sesión');
        }
        const body = await req.json();
        const { priceId, billingPeriod } = CreateCheckoutSchema.parse(body);

        // Obtener configuración del tenant
        const tenantConfig = await TenantService.getConfig(tenantId);

        // Crear o recuperar customer de Stripe
        const customerId = await getOrCreateStripeCustomer(
            tenantId,
            session.user.email || '',
            tenantConfig.name
        );

        // Actualizar tenant con stripeCustomerId si no lo tenía
        if (!tenantConfig.subscription?.stripeCustomerId) {
            await TenantService.updateConfig(tenantId, {
                subscription: {
                    ...tenantConfig.subscription,
                    stripeCustomerId: customerId,
                },
            });
        }

        // Crear sesión de checkout
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const checkoutSession = await createCheckoutSession({
            customerId,
            priceId,
            tenantId,
            successUrl: `${baseUrl}/admin/billing?success=true`,
            cancelUrl: `${baseUrl}/upgrade?cancelled=true`,
        });

        await logEvento({
            level: 'INFO',
            source: 'BILLING_API',
            action: 'CHECKOUT_CREATED',
            message: `Checkout session created for tenant ${tenantId}`, correlationId: correlacion_id,
            details: {
                tenantId,
                priceId,
                billingPeriod,
                sessionId: checkoutSession.id,
            },
        });

        return NextResponse.json({
            success: true,
            checkoutUrl: checkoutSession.url,
        });
    } catch (error: any) {
        await logEvento({
            level: 'ERROR',
            source: 'BILLING_API',
            action: 'CHECKOUT_ERROR',
            message: `Error creating checkout: ${error.message}`, correlationId: correlacion_id,
            stack: error.stack,
        });

        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, error.message).toJSON(),
            { status: 500 }
        );
    }
}
