import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { connectDB } from '@/lib/db';
import { AppError, handleApiError } from '@/lib/errors';
import crypto from 'crypto';
import { UserRole } from '@/types/roles';

const API_SOURCE = 'API_ADMIN_AUDIT_CONFIG';

/**
 * GET /api/admin/audit/config
 * Recupera el historial de auditoría de configuración de tenants (Phase 70 compliance).
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('audit:config', 'read');

        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get('tenantId');

        const db = await connectDB();
        const collection = db.collection('tenant_configs_history');

        const query: Record<string, unknown> = {};

        // Seguridad: Los admins solo ven su tenant
        if (session.user.role === UserRole.ADMIN) {
            const allowedTenants = [
                session.user.tenantId,
                ...(session.user.tenantAccess || []).map(t => t.tenantId)
            ].filter(Boolean);

            if (tenantId) {
                if (!allowedTenants.includes(tenantId)) {
                    throw new AppError('FORBIDDEN', 403, 'No tienes acceso a este tenant');
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
    } catch (error: unknown) {
        return handleApiError(error, API_SOURCE, correlationId);
    }
}
