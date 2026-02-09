import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TenantService } from '@/lib/tenant-service';
import { AppError } from '@/lib/errors';

/**
 * GET /api/admin/tenants/[tenantId]
 * Obtiene la configuración de un tenant específico
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { tenantId } = await params;

        // Solo permitir si es SUPER_ADMIN o si es su propio tenant
        if (session.user.role !== 'SUPER_ADMIN' && session.user.tenantId !== tenantId) {
            throw new AppError('FORBIDDEN', 403, 'No tienes permiso para acceder a este tenant');
        }

        const config = await TenantService.getConfig(tenantId);

        console.log(`[API GET] Tenant ${tenantId} config returned:`, {
            hasBranding: !!config?.branding,
            colors: config?.branding?.colors
        });

        return NextResponse.json(
            { success: true, config },
            {
                headers: {
                    'Cache-Control': 'no-store, max-age=0',
                }
            }
        );
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        return NextResponse.json(
            { success: false, message: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
