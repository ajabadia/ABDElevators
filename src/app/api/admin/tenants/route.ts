import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TenantService } from '@/lib/tenant-service';
import { AppError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/admin/tenants
 * Lista todos los tenants a los que el usuario tiene acceso
 */
export async function GET() {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        let tenants = [];
        if (session.user.role === 'SUPER_ADMIN') {
            tenants = await TenantService.getAllTenants();
        } else {
            // ADMIN normal: solo su tenant y los delegados
            const allowedIds = [
                (session.user as any).tenantId,
                ...((session.user as any).tenantAccess || []).map((t: any) => t.tenantId)
            ].filter(Boolean);

            const all = await TenantService.getAllTenants();
            tenants = all.filter(t => allowedIds.includes(t.tenantId));
        }

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
    const correlationId = crypto.randomUUID();
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

        const updated = await TenantService.updateConfig(tenantId, config, {
            performedBy: session.user.id || 'system', correlationId
        });
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
