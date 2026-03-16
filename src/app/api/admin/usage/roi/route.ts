import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { UsageService } from '@/services/ops/usage-service';
import { AppError, handleApiError } from '@/lib/errors';
import { UserRole } from '@/types/roles';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * Endpoint para obtener métricas de ROI y Ahorro del Tenant (Phase 70 compliance).
 * - Accesible para ADMIN (su propio tenant) y SUPER_ADMIN (cualquier tenant).
 * Refactored to Guardian V3 in Phase 457.
 */
async function GET_internal(request: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_USAGE_ROI', action: 'GET_METRICS' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('usage', 'read');

                const { searchParams } = new URL(request.url);
                const requestedTenantId = searchParams.get('tenantId');

                const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;
                let targetTenantId = session.user.tenantId;

                // Lógica de permisos de visualización
                if (isSuperAdmin) {
                    // SuperAdmin puede ver cualquiera, si no especifica, ve el suyo
                    if (requestedTenantId) {
                        targetTenantId = requestedTenantId;
                    }
                } else {
                    // Admin solo puede ver el suyo
                    if (requestedTenantId && requestedTenantId !== session.user.tenantId) {
                        throw new AppError('FORBIDDEN', 403, 'No tienes permiso para ver métricas de otro tenant');
                    }
                }

                if (!targetTenantId) {
                    throw new AppError('VALIDATION_ERROR', 400, 'Tenant ID no determinado');
                }

                const roiStats = await UsageService.getTenantROI(targetTenantId);

                await log({
                    message: `Usage ROI metrics retrieved for tenant ${targetTenantId}`,
                    details: { tenantId: targetTenantId }
                });

                return NextResponse.json({
                    success: true,
                    tenantId: targetTenantId,
                    ...roiStats
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_USAGE_ROI', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/usage/roi', thresholdMs: 1000 });
