import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createPortalSession } from '@/lib/stripe';
import { TenantService } from '@/lib/tenant-service';
import { AppError } from '@/lib/errors';

/**
 * POST /api/billing/portal
 * Crea una sesión del Stripe Billing Portal para gestionar suscripción
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const tenantId = session.user.tenantId;
        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID no encontrado en la sesión');
        }
        const tenantConfig = await TenantService.getConfig(tenantId);

        const customerId = tenantConfig.subscription?.stripe_customer_id;
        if (!customerId) {
            throw new AppError('NOT_FOUND', 404, 'No se encontró un customer de Stripe para este tenant');
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const portalSession = await createPortalSession(
            customerId,
            `${baseUrl}/admin/billing`
        );

        return NextResponse.json({
            success: true,
            portalUrl: portalSession.url,
        });
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, error.message).toJSON(),
            { status: 500 }
        );
    }
}
