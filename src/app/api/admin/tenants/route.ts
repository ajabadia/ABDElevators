import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TenantService } from '@/lib/tenant-service';
import { AppError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/admin/tenants
 * Lista todos los tenants (Solo ADMIN)
 */
export async function GET() {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const tenants = await TenantService.getAllTenants();
        return NextResponse.json({ success: true, tenants });
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/tenants
 * Crea o actualiza la configuración de un tenant
 */
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const body = await req.json();
        const { tenantId, ...config } = body;

        if (!tenantId) {
            return NextResponse.json(
                { success: false, message: 'tenantId es requerido' },
                { status: 400 }
            );
        }

        const updated = await TenantService.updateConfig(tenantId, config);
        return NextResponse.json({ success: true, config: updated });

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
