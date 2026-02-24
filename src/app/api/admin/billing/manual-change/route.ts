import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { BillingService } from '@/services/admin/BillingService';
import { handleApiError, AppError } from '@/lib/errors';
import { UserRole } from '@/types/roles';
import { TenantSubscriptionSchema } from '@/lib/schemas/billing';
import crypto from 'crypto';

/**
 * POST /api/admin/billing/manual-change
 * Permite a un administrador cambiar manualmente la suscripción de un tenant.
 */
export async function POST(req: NextRequest) {
    const correlationId = `manual_sub_${crypto.randomUUID()}`;

    try {
        // Solo SuperAdmin puede cambiar planes manualmente por ahora (Seguridad)
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
        const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;

        const { tenantId: rawTenantId, subscriptionData } = await req.json();

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

        return NextResponse.json({
            success: true,
            subscription: result,
            correlationId
        });

    } catch (error: any) {
        return handleApiError(error, 'API_ADMIN_BILLING_MANUAL_CHANGE', correlationId);
    }
}
