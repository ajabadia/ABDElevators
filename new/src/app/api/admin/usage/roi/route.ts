import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { UsageService } from '@/lib/usage-service';
import { AppError, handleApiError } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@/types/roles';

/**
 * Endpoint para obtener métricas de ROI y Ahorro del Tenant (Phase 70 compliance).
 * - Accesible para ADMIN (su propio tenant) y SUPER_ADMIN (cualquier tenant).
 */
export async function GET(request: Request) {
    const correlacion_id = uuidv4();
    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

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
            // Admin solo puede ver el suyo (requireRole ya filtró otros roles)
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

    } catch (error) {
        return handleApiError(error, 'API_USAGE_ROI', correlacion_id);
    }
}
