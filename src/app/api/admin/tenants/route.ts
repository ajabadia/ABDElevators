import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { TenantService } from '@/services/tenant/tenant-service';
import { logEvento } from '@/lib/logger';
import { handleApiError, AppError } from '@/lib/errors';
import { getMongoClient } from '@/lib/db';
import { UserRole } from '@/types/roles';
import { MongoSanitizer } from '@/lib/mongo-sanitizer';

const API_SOURCE = 'API_ADMIN_TENANTS';
const SLA_THRESHOLD = 500;

/**
 * GET /api/admin/tenants
 * Lista todos los tenants a los que el usuario tiene acceso
 */
async function GET_internal() {
    const correlationId = crypto.randomUUID();
    const start = Date.now();
    try {
        const session = await requirePermission('tenant', 'read');
        const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;

        let tenants = [];
        if (isSuperAdmin) {
            tenants = await TenantService.getAllTenants();
        } else {
            const allowedIds = [
                session.user.tenantId,
                ...(session.user.tenantAccess || []).map(t => t.tenantId)
            ].filter(Boolean);

            const all = await TenantService.getAllTenants();
            tenants = all.filter(t => allowedIds.includes(t.tenantId));
        }

        return NextResponse.json(
            { success: true, tenants },
            {
                headers: {
                    'Cache-Control': 'no-store, max-age=0, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            }
        );
    } catch (error: unknown) {
        return handleApiError(error, API_SOURCE, correlationId);
    } finally {
        const duration = Date.now() - start;
        if (duration > SLA_THRESHOLD) {
            await logEvento({
                level: 'WARN',
                source: API_SOURCE,
                action: 'SLA_BREACH_GET',
                correlationId,
                message: `GET Tenants excedió SLA`,
                details: { duration_ms: duration }
            });
        }
    }
}

/**
 * POST /api/admin/tenants
 * Crea o actualiza la configuración de un tenant
 */
async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await requirePermission('tenant', 'manage');
        const body = await req.json();
        const { tenantId: rawTenantId, ...config } = body;

        if (!rawTenantId) {
            throw new AppError('VALIDATION_ERROR', 400, 'tenantId is required');
        }

        const tenantId = MongoSanitizer.sanitize(rawTenantId);

        // Security check: Admins can only update their own tenant
        if (session.user.role === UserRole.ADMIN && tenantId !== session.user.tenantId) {
            throw new AppError('FORBIDDEN', 403, 'No tienes permiso para modificar este tenant');
        }

        const client = await getMongoClient();
        const mongoSession = client.startSession();

        let updated;
        try {
            await mongoSession.withTransaction(async () => {
                updated = await TenantService.updateConfig(tenantId, config, {
                    performedBy: session.user.id || 'system',
                    correlationId,
                    session: mongoSession
                });
            });
        } finally {
            await mongoSession.endSession();
        }

        await logEvento({
            level: 'INFO',
            source: API_SOURCE,
            action: 'UPDATE_CONFIG_SUCCESS',
            message: `Configuración del tenant ${tenantId} actualizada por ${session.user.email}`,
            correlationId,
            details: { tenantId, userId: session.user.id }
        });

        return NextResponse.json({ success: true, config: updated });

    } catch (error: unknown) {
        return handleApiError(error, API_SOURCE, correlationId);
    } finally {
        const duration = Date.now() - start;
        if (duration > SLA_THRESHOLD * 2) {
            await logEvento({
                level: 'WARN',
                source: API_SOURCE,
                action: 'SLA_BREACH_POST',
                correlationId,
                message: `POST Tenants excedió SLA`,
                details: { duration_ms: duration }
            });
        }
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/tenants', thresholdMs: 1000 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/tenants', thresholdMs: 1000 });
