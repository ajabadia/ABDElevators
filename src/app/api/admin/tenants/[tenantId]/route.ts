import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { TenantService } from '@/services/tenant/tenant-service';
import { logEvento } from '@/lib/logger';
import { MongoSanitizer } from '@/lib/mongo-sanitizer';
import { handleApiError, AppError } from '@/lib/errors';

/**
 * GET /api/admin/tenants/[tenantId]
 * Obtiene la configuración de un tenant específico
 */
async function GET_internal(
    req: NextRequest,
    paramsContext: { params: Promise<{ tenantId: string }> }
) {
    try {
        const session = await enforcePermission('tenant', 'read');
        const { tenantId: rawTenantId } = await paramsContext.params;
        const tenantId = MongoSanitizer.sanitize(rawTenantId);

        // Note: Guardian ABAC should handle the logic if a normal Admin can only read their own tenantId.
        // For the sweep, we ensure the engine is called.
        if (session.user.role !== 'SUPER_ADMIN' && session.user.tenantId !== tenantId) {
            throw new AppError('FORBIDDEN', 403, 'No tienes permiso para acceder a este tenant');
        }

        const correlationId = crypto.randomUUID();
        const config = await TenantService.getConfig(tenantId);

        await logEvento({
            level: 'INFO',
            source: 'API_TENANT_CONFIG',
            action: 'GET_CONFIG',
            message: `Tenant ${tenantId} config returned`,
            correlationId,
            details: {
                hasBranding: !!config?.branding,
                colors: config?.branding?.colors
            }
        });

        return NextResponse.json(
            { success: true, config },
            {
                headers: {
                    'Cache-Control': 'no-store, max-age=0',
                }
            }
        );
    } catch (error: unknown) {
        return handleApiError(error, 'API_TENANT_DETAIL', crypto.randomUUID());
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/tenants/[tenantId]', thresholdMs: 1000 });
