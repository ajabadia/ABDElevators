import { NextRequest, NextResponse } from 'next/server';
import { createPortalSession } from '@/lib/stripe';
import { TenantService } from '@/services/tenant/tenant-service';
import { handleApiError, AppError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/billing/portal
 * Crea una sesión del Stripe Billing Portal para gestionar suscripción
 * SLA: P95 < 1000ms
 */
export const POST = withPerformanceSLA(async (req: NextRequest) =>
    withCorrelation(
        { level: 'INFO', source: 'APIBILLINGPORTAL', action: 'CREATEPORTALSESSION' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('billing:portal', 'manage');

                const tenantId = session.user.tenantId;
                const tenantConfig = await TenantService.getConfig(tenantId);

                const customerId = tenantConfig.subscription?.stripeCustomerId;
                if (!customerId) {
                    throw new AppError('NOT_FOUND', 404, 'No se encontró un customer de Stripe para este tenant');
                }

                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                const portalSession = await createPortalSession(
                    customerId,
                    `${baseUrl}/admin/billing`
                );

                await log({
                    message: 'Stripe billing portal session created',
                    details: {
                        tenantId,
                        userId: session.user.id,
                        stripeCustomerId: customerId
                    }
                });

                return NextResponse.json({
                    success: true,
                    portalUrl: portalSession.url,
                    correlationId
                });
            } catch (error) {
                return handleApiError(error, 'APIBILLINGPORTAL', correlationId);
            }
        }
    ),
    { endpoint: 'POST /api/billing/portal', thresholdMs: 1000 }
);
