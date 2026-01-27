import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UsageService } from '@/lib/usage-service';
import { AppError, handleApiError } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';

/**
 * Endpoint para obtener métricas de ROI y Ahorro del Tenant.
 * - Accesible para ADMIN (su propio tenant) y SUPER_ADMIN (cualquier tenant).
 * - Fase 24.2b
 */
export async function GET(request: Request) {
    const correlacion_id = uuidv4();
    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { searchParams } = new URL(request.url);
        const requestedTenantId = searchParams.get('tenantId');

        let targetTenantId = session.user.tenantId;

        // Lógica de permisos de visualización
        if (session.user.role === 'SUPER_ADMIN') {
            // SuperAdmin puede ver cualquiera, si no especifica, ve el suyo (o el default)
            if (requestedTenantId) {
                targetTenantId = requestedTenantId;
            }
        } else if (session.user.role === 'ADMIN') {
            // Admin solo puede ver el suyo. Si intenta pedir otro, se ignora o se da error.
            if (requestedTenantId && requestedTenantId !== session.user.tenantId) {
                throw new AppError('FORBIDDEN', 403, 'No tienes permiso para ver métricas de otro tenant');
            }
        } else {
            // Otros roles (TECNICO, INGENIERIA) no tienen acceso a datos de ROI/Billing
            throw new AppError('FORBIDDEN', 403, 'Acceso restringido a Administradores');
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
