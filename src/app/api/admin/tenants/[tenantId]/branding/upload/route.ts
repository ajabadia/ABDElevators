import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadBrandingAsset, deleteFromCloudinary } from '@/lib/cloudinary';
import { TenantService } from '@/lib/tenant-service';
import { AppError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * POST /api/admin/tenants/[tenantId]/branding/upload
 * Sube un logo o favicon para el branding del tenant.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await auth();
        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { tenantId } = await params;

        // El ADMIN solo puede subir a su propio tenant. 
        // El SUPER_ADMIN puede subir a cualquiera.
        if (session.user.role === 'ADMIN' && session.user.tenantId !== tenantId) {
            throw new AppError('FORBIDDEN', 403, 'No tienes permiso para modificar este tenant');
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const type = (formData.get('type') as 'logo' | 'favicon') || 'logo';

        if (!file) {
            throw new AppError('VALIDATION_ERROR', 400, 'Archivo no proporcionado');
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 1. Obtener config actual para ver si hay que borrar el asset anterior
        const currentConfig = await TenantService.getConfig(tenantId);
        const oldAsset = type === 'logo' ? currentConfig.branding?.logo : currentConfig.branding?.favicon;

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
        console.error(`[BrandingUpload ERROR] ${error.message}`);
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        return NextResponse.json(
            { success: false, message: 'Internal Server Error', correlationId: correlacion_id},
            { status: 500 }
        );
    }
}
