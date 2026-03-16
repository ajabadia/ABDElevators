import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { TenantService } from '@/services/tenant/tenant-service';
import { MongoSanitizer } from '@/lib/mongo-sanitizer';
import { handleApiError, AppError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/tenants/[tenantId]
 * Obtiene la configuración de un tenant específico
 */
async function GET_internal(
    req: NextRequest,
    paramsContext: { params: Promise<{ tenantId: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_TENANT_CONFIG', action: 'GET_CONFIG' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('tenant', 'read');
                const { tenantId: rawTenantId } = await paramsContext.params;
                const tenantId = MongoSanitizer.sanitize(rawTenantId);

                // Note: Guardian ABAC should handle the logic if a normal Admin can only read their own tenantId.
                if (session.user.role !== 'SUPER_ADMIN' && session.user.tenantId !== tenantId) {
                    throw new AppError('FORBIDDEN', 403, 'No tienes permiso para acceder a este tenant');
                }

                const config = await TenantService.getConfig(tenantId);

                await log({
                    message: `Tenant ${tenantId} config returned`,
                    details: {
                        tenantId,
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
                return handleApiError(error, 'API_TENANT_DETAIL', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/tenants/[tenantId]', thresholdMs: 1000 });
