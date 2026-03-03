import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { TenantService } from '@/services/tenant/tenant-service';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';

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
        const { tenantId } = await paramsContext.params;

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
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json(
            { success: false, message },
            { status: 500 }
        );
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/tenants/[tenantId]', thresholdMs: 1000 });
