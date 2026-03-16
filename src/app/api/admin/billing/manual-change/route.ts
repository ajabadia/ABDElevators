import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/services/admin/BillingService';
import { handleApiError, AppError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { UserRole } from '@/types/roles';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/admin/billing/manual-change
 * Permite a un administrador cambiar manualmente la suscripción de un tenant.
 * SLA: P95 < 1000ms
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_BILLING_MANUAL_CHANGE', action: 'EXECUTE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('billing:plan', 'update');
                const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;

                const body = await req.json();
                const { tenantId: rawTenantId, subscriptionData } = body;

                if (!rawTenantId) {
                    throw new AppError('VALIDATION_ERROR', 400, 'tenantId es requerido');
                }

                const tenantId = rawTenantId === 'current' ? session.user.tenantId : rawTenantId;

                // Si no es SuperAdmin, solo puede cambiar su propio tenant
                if (!isSuperAdmin && session.user.tenantId !== tenantId) {
                    throw new AppError('FORBIDDEN', 403, 'Solo un SuperAdmin puede realizar cambios manuales en otros tenants.');
                }

                const result = await BillingService.manualUpdateSubscription(
                    tenantId,
                    subscriptionData,
                    session.user.email!
                );

                await log({
                    message: `Manual subscription update for tenant ${tenantId}`,
                    details: { tenantId, subscriptionData }
                });

                return NextResponse.json({
                    success: true,
                    subscription: result,
                    correlationId
                });
            } catch (error) {
                return handleApiError(error, 'API_ADMIN_BILLING_MANUAL_CHANGE_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/billing/manual-change', thresholdMs: 1000 });
