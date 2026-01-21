import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Función genérica para subir a una carpeta específica
 */
async function uploadToFolder(
    buffer: Buffer,
    filename: string,
    folder: string,
    resourceType: 'raw' | 'image' = 'raw'
): Promise<{ url: string; publicId: string; secureUrl: string }> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: resourceType,
                folder,
                public_id: `${Date.now()}_${filename.replace(/\.[^/.]+$/, '')}`,
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

        uploadStream.end(buffer);
    });
}

/**
 * Sube un PDF técnico para el RAG
 */
export async function uploadRAGDocument(
    buffer: Buffer,
    filename: string
): Promise<{ url: string; publicId: string; secureUrl: string }> {
    return uploadToFolder(buffer, filename, 'abd-elevators/documentos-rag');
}

/**
 * Sube un documento de usuario a su carpeta personal
 */
export async function uploadUserDocument(
    buffer: Buffer,
    filename: string,
    userId: string
): Promise<{ url: string; publicId: string; secureUrl: string }> {
    return uploadToFolder(buffer, filename, `abd-elevators/usuarios/${userId}/documentos`);
}

/**
 * Sube una foto de perfil de usuario
 */
export async function uploadProfilePhoto(
    buffer: Buffer,
    filename: string,
    userId: string
): Promise<{ url: string; publicId: string; secureUrl: string }> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'image',
                folder: `abd-elevators/usuarios/${userId}/perfil`,
                public_id: `perfil_${Date.now()}`,
                transformation: [
                    { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                    { quality: 'auto', fetch_format: 'auto' }
                ]
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
    folder: string = 'abd-elevators/documentos'
): Promise<{ url: string; publicId: string; secureUrl: string }> {
    return uploadToFolder(buffer, filename, folder);
}

/**
 * Elimina un archivo de Cloudinary
 */
export async function deleteFromCloudinary(publicId: string, resourceType: 'raw' | 'image' = 'raw'): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * Elimina un PDF de Cloudinary
 * @deprecated Use deleteFromCloudinary instead
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
