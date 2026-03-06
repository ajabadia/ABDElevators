import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { AppError } from '@/lib/errors';
import { QuotaService } from '@/services/security/quota-service';
import { requireRole, validateTenantOwnership } from '@/lib/api-auth';

/**
 * GET /api/admin/usage/stats
 * Devuelve estadísticas de consumo agregadas para el tenant.
 */
async function GET_internal(req: NextRequest) {
    try {
        // 🛡️ Defense in Depth: Re-verify auth even if middleware is bypassed
        const session = await requireRole(['ADMIN', 'SUPER_ADMIN', 'USER']);
        // Still enforce specific permission via Guardian
        await enforcePermission('usage:stats', 'read');

        const { searchParams } = new URL(req.url);
        const overrideTenantId = searchParams.get('tenantId');
        const isSuperAdmin = session.user.role === 'SUPER_ADMIN';

        const tenantId = (isSuperAdmin && overrideTenantId) ? overrideTenantId : session.user.tenantId;

        // 🛡️ [SECURITY] IDOR Protection: Validate requested tenant matches session
        if (!isSuperAdmin) {
            validateTenantOwnership(session.user.tenantId, tenantId);
        }

        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID no encontrado en la sesión');
        }

        // Delegar toda la lógica de cálculo al QuotaService
        const stats = await QuotaService.getTenantUsageStats(tenantId);

        return NextResponse.json({
            success: true,
            tenantId,
            stats
        });

    } catch (error: unknown) {
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        console.error('[API Usage Stats] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(new AppError('INTERNAL_ERROR', 500, errorMessage).toJSON(), { status: 500 });
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/usage/stats', thresholdMs: 500 });
