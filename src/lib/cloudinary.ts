import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Sube un PDF a Cloudinary
 * @param buffer - Buffer del archivo PDF
 * @param filename - Nombre del archivo
 * @param folder - Carpeta en Cloudinary (default: 'abd-elevators/documentos')
 * @returns URL pública del archivo y public_id
 */
export async function uploadPDFToCloudinary(
    buffer: Buffer,
    filename: string,
    folder: string = 'abd-elevators/documentos'
): Promise<{ url: string; publicId: string; secureUrl: string }> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'raw', // Para PDFs usamos 'raw'
                folder,
                public_id: `${Date.now()}_${filename.replace(/\.pdf$/i, '')}`,
                format: 'pdf',
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
 * Elimina un PDF de Cloudinary
 * @param publicId - ID público del archivo en Cloudinary
 */
export async function deletePDFFromCloudinary(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
}

/**
 * Obtiene la URL de descarga de un PDF
 * @param publicId - ID público del archivo
 * @returns URL de descarga
 */
export function getPDFDownloadUrl(publicId: string): string {
    return cloudinary.url(publicId, {
        resource_type: 'raw',
        flags: 'attachment', // Fuerza descarga en lugar de visualización
    });
}
