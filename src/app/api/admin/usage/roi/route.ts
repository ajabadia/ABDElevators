import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { UsageService } from '@/services/ops/usage-service';
import { AppError, handleApiError } from '@/lib/errors';
import { UserRole } from '@/types/roles';

/**
 * Endpoint para obtener métricas de ROI y Ahorro del Tenant (Phase 70 compliance).
 * - Accesible para ADMIN (su propio tenant) y SUPER_ADMIN (cualquier tenant).
 */
async function GET_internal (request: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('usage', 'read');

        const { searchParams } = new URL(request.url);
        const requestedTenantId = searchParams.get('tenantId');

        let targetTenantId = session.user.tenantId;

        // Lógica de permisos de visualización
        if (session.user.role === UserRole.SUPER_ADMIN) {
            // SuperAdmin puede ver cualquiera, si no especifica, ve el suyo
            if (requestedTenantId) {
                targetTenantId = requestedTenantId;
            }
        } else {
            // Admin solo puede ver el suyo (ABAC ya filtró en enforcePermission si fuera otro recurso,
            // pero aquí 'usage' es a nivel de tenant).
            if (requestedTenantId && requestedTenantId !== session.user.tenantId) {
                throw new AppError('FORBIDDEN', 403, 'No tienes permiso para ver métricas de otro tenant');
            }
        }

        if (!targetTenantId) {
            throw new AppError('VALIDATION_ERROR', 400, 'Tenant ID no determinado');
        }

        const roiStats = await UsageService.getTenantROI(targetTenantId);

        return NextResponse.json({
            success: true,
            tenantId: targetTenantId,
            ...roiStats
        });

    } catch (error: unknown) {
        return handleApiError(error, 'API_USAGE_ROI', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/usage/roi', thresholdMs: 1000 });
