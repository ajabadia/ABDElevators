import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TenantService } from '@/services/tenant/tenant-service';
import { AppError } from '@/lib/errors';

/**
 * GET /api/tenant/branding
 * Recupera la configuración de marca (branding) para el tenant del usuario actual.
 * Accesible para cualquier usuario autenticado (no solo admins).
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.tenantId) {
            throw new AppError('UNAUTHORIZED', 401, 'No se encontró información del tenant en la sesión');
        }

        const tenantId = session.user.tenantId;
        const config = await TenantService.getConfig(tenantId);

        // Devolvemos solo la parte de branding para evitar fugas de datos sensibles
        const branding = config.branding || {
            companyName: config.name,
            colors: {
                primary: '#0d9488', // Teal 600 default
                accent: '#14b8a6',  // Teal 500 default
            }
        };

        return NextResponse.json({
            success: true,
            branding: {
                ...branding,
                companyName: branding.companyName || config.name
            }
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

    } catch (error: unknown) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        console.error('[API_BRANDING_ERROR]', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
