import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { uploadBrandingAsset, deleteFromCloudinary } from '@/lib/cloudinary';
import { TenantService } from '@/services/tenant/tenant-service';
import { AppError, handleApiError } from '@/lib/errors';
import crypto from 'crypto';
import { UserRole } from '@/types/roles';

/**
 * POST /api/admin/tenants/[tenantId]/branding/upload
 * Sube un logo o favicon para el branding del tenant (Phase 70 compliance).
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
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
                console.error(`Error deleting old ${type} from Cloudinary:`, e);
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

        return NextResponse.json({
            success: true,
            asset: { url: result.secureUrl, publicId: result.publicId }
        });

    } catch (error: any) {
        return handleApiError(error, 'API_ADMIN_BRANDING_UPLOAD', correlacion_id);
    }
}
