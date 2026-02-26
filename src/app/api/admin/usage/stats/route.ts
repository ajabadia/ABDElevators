import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { QuotaService } from '@/services/security/quota-service';

/**
 * GET /api/admin/usage/stats
 * Devuelve estadísticas de consumo agregadas para el tenant.
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const tenantId = session.user.tenantId;
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
