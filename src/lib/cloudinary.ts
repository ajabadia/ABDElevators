import { v2 as cloudinary } from 'cloudinary';
import { UsageService } from './usage-service';
import { TenantService, TenantQuotaService } from './tenant-service';
import { AppError } from '@/lib/errors';

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper type for Stream input (Node or Web)
type StreamInput = Buffer | ReadableStream<Uint8Array> | NodeJS.ReadableStream;

/**
 * Función genérica para subir a una carpeta específica (con aislamiento por tenant)
 * Supports Buffer or Stream
 */
async function uploadToFolder(
    input: StreamInput,
    filename: string,
    folder: string,
    resourceType: 'raw' | 'image' = 'raw'
): Promise<{ url: string; publicId: string; secureUrl: string }> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: resourceType,
                type: 'upload', // Ensure public access even for 'raw' types
                folder,
                public_id: resourceType === 'raw' ? filename : filename.replace(/\.[^/.]+$/, ''),
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else if (result) {
                    resolve({
                        url: result.url,
                        publicId: result.public_id,
                        secureUrl: result.secure_url,
                    });
                } else {
                    reject(new Error('Upload failed without error'));
                }
            }
        );

        if (Buffer.isBuffer(input)) {
            uploadStream.end(input);
        } else if (input instanceof ReadableStream) {
            // Web Stream to Node Stream
            // @ts-ignore
            const { Readable } = require('stream');
            // @ts-ignore
            const nodeStream = Readable.fromWeb(input);
            nodeStream.pipe(uploadStream);
        } else {
            // Node Stream
            input.pipe(uploadStream);
        }
    });
}

/**
 * Sube un PDF técnico para el RAG (Carpeta aislada por tenant)
 * Supports Streaming directly from Request
 */
export async function uploadRAGDocument(
    input: StreamInput,
    filename: string,
    tenantId: string,
    options: { estimatedSize?: number; fileHash?: string } = {}
): Promise<{ url: string; publicId: string; secureUrl: string }> {
    const { estimatedSize = 0, fileHash } = options;
    // 1. Verificar quota del tenant (Approximation if stream)
    const size = Buffer.isBuffer(input) ? input.length : estimatedSize;

    // We check quota if size is known or > 0
    if (size > 0) {
        const hasQuota = await TenantQuotaService.hasStorageQuota(tenantId, size);
        if (!hasQuota) {
            throw new AppError('STORAGE_QUOTA_EXCEEDED', 403, 'El tenant ha excedido su cuota de almacenamiento');
        }
    }

    // 2. Obtener prefijo de carpeta según config del tenant
    const folderPrefix = await TenantQuotaService.getCloudinaryPrefix(tenantId);

    // Use MD5 if provided to allow overwriting, otherwise fallback to timestamp
    const uniqueId = fileHash || Date.now().toString();
    const finalPublicId = `${uniqueId}/${filename}`; // Use / to create a "folder" hierarchy in Cloudinary

    const result = await uploadToFolder(input, finalPublicId, `${folderPrefix}/documentos-rag`);
    await UsageService.trackStorage(tenantId, size, 'cloudinary-rag-docs');
    return result;
}

/**
 * Sube un informe generado por LLM (PDF)
 */
export async function uploadLLMReport(
    buffer: Buffer,
    filename: string,
    tenantId: string
): Promise<{ url: string; publicId: string; secureUrl: string }> {
    const folderPrefix = await TenantQuotaService.getCloudinaryPrefix(tenantId);

    const result = await uploadToFolder(buffer, filename, `${folderPrefix}/informes`);
    // Trackeamos el uso de almacenamiento para informes específicamente
    await UsageService.trackStorage(tenantId, buffer.length, 'cloudinary-llm-reports');
    return result;
}

/**
 * Sube un documento de usuario a su carpeta personal
 */
export async function uploadUserDocument(
    buffer: Buffer,
    filename: string,
    tenantId: string,
    userId: string
): Promise<{ url: string; publicId: string; secureUrl: string }> {
    const result = await uploadToFolder(buffer, filename, `abd-rag-platform/tenants/${tenantId}/usuarios/${userId}/documentos`);
    await UsageService.trackStorage(tenantId, buffer.length, 'cloudinary-user-docs');
    return result;
}

/**
 * Sube una foto de perfil de usuario
 */
export async function uploadProfilePhoto(
    buffer: Buffer,
    filename: string,
    tenantId: string,
    userId: string
): Promise<{ url: string; publicId: string; secureUrl: string }> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'image',
                folder: `abd-rag-platform/tenants/${tenantId}/usuarios/${userId}/perfil`,
                public_id: `perfil_${Date.now()}`,
                transformation: [
                    { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                    { quality: 'auto', fetch_format: 'auto' }
                ]
            },
            async (error, result) => {

                if (error) {
                    reject(error);
                } else if (result) {
                    await UsageService.trackStorage(tenantId, buffer.length, 'cloudinary-profile-photos');
                    resolve({
                        url: result.url,
                        publicId: result.public_id,
                        secureUrl: result.secure_url,
                    });
                } else {
                    reject(new Error('Upload failed without error'));
                }
            }
        );

        uploadStream.end(buffer);
    });
}

/**
 * Sube un PDF a Cloudinary (legacy - usar uploadRAGDocument en su lugar)
 * @deprecated Use uploadRAGDocument instead
 */
export async function uploadPDFToCloudinary(
    buffer: Buffer,
    filename: string,
    tenantId: string,
    folder: string = ''
): Promise<{ url: string; publicId: string; secureUrl: string }> {
    const targetFolder = folder || `abd-rag-platform/tenants/${tenantId}/documentos`;
    const result = await uploadToFolder(buffer, filename, targetFolder);
    await UsageService.trackStorage(tenantId, buffer.length, 'cloudinary-legacy-docs');
    return result;
}

/**
 * Sube un asset de branding (logo, favicon)
 */
export async function uploadBrandingAsset(
    buffer: Buffer,
    filename: string,
    tenantId: string,
    assetType: 'logo' | 'favicon' | 'documentLogo'
): Promise<{ url: string; publicId: string; secureUrl: string }> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'image',
                folder: `abd-rag-platform/tenants/${tenantId}/branding`,
                public_id: `${assetType}_${Date.now()}`,
                transformation: assetType === 'logo'
                    ? [{ width: 800, height: 400, crop: 'limit' }, { quality: 'auto', fetch_format: 'auto' }]
                    : [{ width: 64, height: 64, crop: 'fill' }, { quality: 'auto', fetch_format: 'auto' }]
            },
            async (error, result) => {
                if (error) {
                    reject(error);
                } else if (result) {
                    await UsageService.trackStorage(tenantId, buffer.length, `cloudinary-branding-${assetType}`);
                    resolve({
                        url: result.url,
                        publicId: result.public_id,
                        secureUrl: result.secure_url,
                    });
                } else {
                    reject(new Error('Upload failed without error'));
                }
            }
        );

        uploadStream.end(buffer);
    });
}

/**
 * Elimina un archivo de Cloudinary
 */
export async function deleteFromCloudinary(publicId: string, resourceType: 'raw' | 'image' = 'raw'): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * Elimina un PDF de Cloudinary
 */
export async function deletePDFFromCloudinary(publicId: string): Promise<void> {
    await deleteFromCloudinary(publicId, 'raw');
}

/**
 * Obtiene la URL de descarga de un archivo
 */
export function getDownloadUrl(publicId: string, resourceType: 'raw' | 'image' = 'raw'): string {
    return cloudinary.url(publicId, {
        resource_type: resourceType,
        flags: 'attachment',
    });
}

/**
 * Obtiene la URL de descarga de un PDF
 * @deprecated Use getDownloadUrl instead
 */
export function getPDFDownloadUrl(publicId: string): string {
    return getDownloadUrl(publicId, 'raw');
}

/**
 * Generates a SIGNED URL for internal server-side fetches.
 * This bypasses ACL restrictions and ensures the worker can access the file.
 */
export function getSignedUrl(publicId: string, resourceType: 'raw' | 'image' = 'raw'): string {
    return cloudinary.url(publicId, {
        resource_type: resourceType,
        sign_url: true,
        type: 'upload',
    });
}
