import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError } from '@/lib/errors';
import crypto from 'crypto';
import { UserRole } from '@/types/roles';

/**
 * GET /api/admin/audit/config
 * Recupera el historial de auditoría de configuración de tenants (Phase 70 compliance).
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get('tenantId');

        const db = await connectDB();
        const collection = db.collection('tenant_configs_history');

        const query: any = {};

        // Seguridad: Los admins solo ven su tenant
        if (session.user.role === UserRole.ADMIN) {
            const allowedTenants = [
                session.user.tenantId,
                ...(session.user.tenantAccess || []).map((t: any) => t.tenantId)
            ].filter(Boolean);

            if (tenantId) {
                if (!allowedTenants.includes(tenantId)) {
                    throw new AppError('UNAUTHORIZED', 403, 'No tienes acceso a este tenant');
                }
                query.tenantId = tenantId;
            } else {
                query.tenantId = { $in: allowedTenants };
            }
        } else if (tenantId) {
            query.tenantId = tenantId;
        }

        const history = await collection
            .find(query)
            .sort({ timestamp: -1 })
            .limit(100)
            .toArray();

        return NextResponse.json({ success: true, history });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_AUDIT_CONFIG', correlacion_id);
    }
}
