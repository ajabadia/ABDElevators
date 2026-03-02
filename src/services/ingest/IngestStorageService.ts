
import { GridFSUtils } from '@/lib/gridfs-utils';
import { uploadPDFToCloudinary, getSignedUrl } from '@/lib/cloudinary';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';

/**
 * 📦 Ingest Storage Service
 * Proposito: Abstraer el almacenamiento de archivos (GridFS + Cloudinary).
 */
export class IngestStorageService {
    /**
     * Obtiene el buffer del archivo, priorizando GridFS y cayendo a Cloudinary.
     */
    static async getBuffer(asset: { blobId?: string, filename: string, tenantId: string, cloudinaryUrl?: string, cloudinaryPublicId?: string, cloudinary_public_id?: string }, correlationId: string): Promise<Buffer> {
        // 1. Intentar GridFS (Pipeline v2)
        if (asset.blobId) {
            try {
                return await GridFSUtils.getForProcessing(asset.blobId, correlationId);
            } catch (err) {
                console.warn(`[IngestStorageService] GridFS fallback for ${asset.blobId}:`, err);
            }
        }

        // 2. Fallback a Cloudinary
        return await this.fetchFromCloudinary(asset, correlationId);
    }

    /**
     * Sube a Cloudinary de forma asíncrona.
     */
    static async uploadToCloudinary(buffer: Buffer, asset: { filename: string, tenantId: string }, correlationId: string) {
        try {
            const result = await uploadPDFToCloudinary(buffer, asset.filename, asset.tenantId);
            return { success: true, url: result.secureUrl, publicId: result.publicId };
        } catch (error: unknown) {
            const err = error as Error;
            await logEvento({
                level: 'ERROR',
                source: 'INGEST_STORAGE_SERVICE',
                action: 'CLOUDFINARY_UPLOAD_FAILED',
                message: err.message,
                correlationId,
                tenantId: asset.tenantId
            });
            return { success: false, error: err.message };
        }
    }

    private static async fetchFromCloudinary(asset: { cloudinaryUrl?: string, cloudinaryPublicId?: string, cloudinary_public_id?: string }, correlationId: string): Promise<Buffer> {
        if (!asset.cloudinaryUrl) {
            throw new AppError('EXTERNAL_SERVICE_ERROR', 503, 'Asset sin URL de Cloudinary');
        }

        const signedUrl = getSignedUrl((asset.cloudinaryPublicId || asset.cloudinary_public_id) || '', 'raw');
        if (!signedUrl) {
            throw new AppError('EXTERNAL_SERVICE_ERROR', 503, 'No se pudo generar URL firmada de Cloudinary');
        }
        const response = await fetch(signedUrl);

        if (!response.ok) {
            throw new Error(`Cloudinary fetch failed: ${response.status}`);
        }

        return Buffer.from(await response.arrayBuffer());
    }

    /**
     * Guarda temporalmente en GridFS para procesamiento.
     */
    static async saveToGridFS(buffer: Buffer, tenantId: string, correlationId: string) {
        return await GridFSUtils.saveForProcessing(buffer, tenantId, 'pending', correlationId);
    }

    /**
     * Elimina un archivo de GridFS.
     */
    static async deleteFile(storagePath: string, correlationId: string = 'SYSTEM') {
        if (!storagePath) return;
        try {
            await GridFSUtils.deleteFile(storagePath, correlationId);
        } catch (error) {
            console.error(`[IngestStorageService] Error deleting file ${storagePath}:`, error);
        }
    }
}
