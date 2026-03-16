import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { uploadBrandingAsset, deleteFromCloudinary } from '@/lib/cloudinary';
import { TenantService } from '@/services/tenant/tenant-service';
import { AppError, handleApiError } from '@/lib/errors';
import { UserRole } from '@/types/roles';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/admin/tenants/[tenantId]/branding/upload
 * Sube un logo o favicon para el branding del tenant (Phase 70 compliance).
 */
async function POST_internal (
    req: NextRequest,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_BRANDING', action: 'UPLOAD_ASSET' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('tenant:branding', 'update');
                const { tenantId } = await params;

                // El ADMIN solo puede subir a su propio tenant. 
                // El SUPER_ADMIN puede subir a cualquiera.
                if (session.user.role === UserRole.ADMIN && session.user.tenantId !== tenantId) {
                    throw new AppError('FORBIDDEN', 403, 'No tienes permiso para modificar este tenant');
                }

                const formData = await req.formData();
                const file = formData.get('file') as File;
                const type = (formData.get('type') as 'logo' | 'favicon' | 'documentLogo') || 'logo';

                if (!file) {
                    throw new AppError('VALIDATION_ERROR', 400, 'Archivo no proporcionado');
                }

                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);

                // 1. Obtener config actual para ver si hay que borrar el asset anterior
                const currentConfig = await TenantService.getConfig(tenantId);
                const oldAsset = type === 'logo' ? currentConfig.branding?.logo : (type === 'favicon' ? currentConfig.branding?.favicon : currentConfig.branding?.documentLogo);

                // 2. Subir a Cloudinary
                const result = await uploadBrandingAsset(buffer, file.name, tenantId, type);

                // 3. Si había uno anterior, borrarlo de Cloudinary para no acumular basura
                if (oldAsset?.publicId) {
                    try {
                        await deleteFromCloudinary(oldAsset.publicId, 'image');
                    } catch (e) {
                        await log({
                            level: 'WARN',
                            message: `Error deleting old ${type} from Cloudinary`,
                            details: { error: e instanceof Error ? e.message : String(e), publicId: oldAsset.publicId }
                        });
                    }
                }

                // 4. Actualizar la configuración del tenant en la DB
                const updatedBranding = {
                    ...(currentConfig.branding || {}),
                    [type]: {
                        url: result.secureUrl,
                        publicId: result.publicId
                    }
                };

                await TenantService.updateConfig(tenantId, {
                    ...currentConfig,
                    branding: updatedBranding
                });

                await log({
                    message: `Branding ${type} uploaded for tenant ${tenantId}`,
                    details: { tenantId, type, publicId: result.publicId }
                });

                return NextResponse.json({
                    success: true,
                    asset: { url: result.secureUrl, publicId: result.publicId }
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_BRANDING_UPLOAD', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/tenants/[tenantId]/branding/upload', thresholdMs: 2000 });
