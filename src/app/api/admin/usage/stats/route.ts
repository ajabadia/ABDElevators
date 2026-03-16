import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { QuotaService } from '@/services/security/quota-service';
import { UserRole } from '@/types/roles';

/**
 * GET /api/admin/usage/stats
 * Devuelve estadísticas de consumo agregadas para el tenant.
 * Refactored to Guardian V3 in Phase 457.
 */
async function GET_internal(req: NextRequest) {
    try {
        // 🛡️ Defense in Depth: Secure access via Guardian
        const session = await requirePermission('usage:stats', 'read');

        const { searchParams } = new URL(req.url);
        const overrideTenantId = searchParams.get('tenantId');
        const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;

        const tenantId = (isSuperAdmin && overrideTenantId) ? overrideTenantId : session.user.tenantId;

        // 🛡️ [SECURITY] IDOR Protection: Validate requested tenant matches session
        if (!isSuperAdmin && overrideTenantId && overrideTenantId !== session.user.tenantId) {
             throw new AppError('FORBIDDEN', 403, 'No tienes permiso para ver métricas de otro tenant');
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
