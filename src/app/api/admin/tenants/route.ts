import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { TenantService } from '@/lib/tenant-service';
import { handleApiError, ValidationError } from '@/lib/errors';
import crypto from 'crypto';
import { UserRole } from '@/types/roles';

/**
 * GET /api/admin/tenants
 * Lista todos los tenants a los que el usuario tiene acceso
 */
export async function GET() {
    const correlacion_id = crypto.randomUUID();
    try {
        // Phase 70: Centralized typed role check
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

        let tenants = [];
        if (session.user.role === UserRole.SUPER_ADMIN) {
            tenants = await TenantService.getAllTenants();
        } else {
            // ADMIN normal: solo su tenant y los delegados
            const allowedIds = [
                session.user.tenantId,
                ...(session.user.tenantAccess || []).map((t: any) => t.tenantId)
            ].filter(Boolean);

            const all = await TenantService.getAllTenants();
            tenants = all.filter(t => allowedIds.includes(t.tenantId));
        }

        return NextResponse.json({ success: true, tenants });
    } catch (error: any) {
        return handleApiError(error, 'API_ADMIN_TENANTS_GET', correlacion_id);
    }
}

/**
 * POST /api/admin/tenants
 * Crea o actualiza la configuración de un tenant
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        // Phase 70: Centralized typed role check
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

        const body = await req.json();
        const { tenantId, ...config } = body;

        if (!tenantId) {
            throw new ValidationError('tenantId is required');
        }

        const updated = await TenantService.updateConfig(tenantId, config, {
            performedBy: session.user.id || 'system', correlationId
        });
        return NextResponse.json({ success: true, config: updated });

    } catch (error: any) {
        return handleApiError(error, 'API_ADMIN_TENANTS_POST', correlationId);
    }
}
