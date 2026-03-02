import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/services/admin/BillingService';
import { handleApiError, AppError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { withPerformanceSLA } from '@/lib/performance-sla';
import { UserRole } from '@/types/roles';
import crypto from 'crypto';

/**
 * POST /api/admin/billing/manual-change
 * Permite a un administrador cambiar manualmente la suscripción de un tenant.
 * SLA: P95 < 1000ms
 */
export const POST = withPerformanceSLA(async (req: NextRequest) => {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('billing:plan', 'update');
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

        return NextResponse.json({
            success: true,
            subscription: result,
            correlationId
        });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_BILLING_MANUAL_CHANGE_POST', correlationId);
    }
}, { p95: 1000, max: 2000 });
