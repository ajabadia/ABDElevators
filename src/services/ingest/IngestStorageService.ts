
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
    static async getBuffer(asset: any, correlationId: string): Promise<Buffer> {
        const effectiveBlobId = asset.blobId || (asset.source?.storageProvider === 'gcs' ? asset.source.storageKey : null);
        
        console.log(`[INGEST_TRACE] IngestStorageService.getBuffer for asset ${asset._id || 'unknown'}. blobId: ${asset.blobId}, effective: ${effectiveBlobId}`);
        
        // 1. Intentar GridFS (Pipeline v2)
        if (effectiveBlobId) {
            try {
                const buffer = await GridFSUtils.getForProcessing(effectiveBlobId, correlationId);
                console.log(`[INGEST_TRACE] GridFS retrieval success for ${effectiveBlobId} (${buffer.length} bytes)`);
                return buffer;
            } catch (err) {
                console.warn(`[INGEST_TRACE] GridFS retrieval failed for ${effectiveBlobId}, falling back to Cloudinary. Error:`, err);
            }
        } else {
            console.log(`[INGEST_TRACE] No blobId found in asset, skipping GridFS.`);
        }

        // 2. Fallback a Cloudinary
        return await this.fetchFromCloudinary(asset, correlationId);
    }

    /**
     * Sube a Cloudinary de forma asíncrona.
     */
    static async uploadToCloudinary(buffer: Buffer, asset: { filename: string, tenantId: string }, correlationId: string, fileHash?: string) {
        try {
            const { uploadRAGDocument } = await import('@/lib/cloudinary');
            const result = await uploadRAGDocument(buffer, asset.filename, asset.tenantId, { fileHash });
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

    private static async fetchFromCloudinary(asset: any, correlationId: string): Promise<Buffer> {
        const downloadUrl = asset.source?.downloadUrl || asset.cloudinaryUrl;
        console.log(`[INGEST_TRACE] fetchFromCloudinary. downloadUrl present: ${!!downloadUrl}`);
        
        if (!downloadUrl) {
            const diagnosticInfo = {
                id: asset._id || asset.id,
                blobId: asset.blobId,
                hasDownloadUrl: !!asset.source?.downloadUrl,
                hasCloudinaryUrl: !!asset.cloudinaryUrl,
                originalName: asset.source?.originalName || asset.filename
            };
            console.error(`[INGEST_TRACE] FATAL: Asset has NO valid storage reference. Component: IngestStorageService.fetchFromCloudinary. Info:`, diagnosticInfo);
            
            throw new AppError(
                'EXTERNAL_SERVICE_ERROR', 
                503, 
                `Asset sin URL de descarga ni referencia en GridFS (ID: ${diagnosticInfo.id}, Storage: ${asset.blobId ? 'GridFS-Ref-Missing' : 'Cloudinary-URL-Missing'})`
            );
        }

        const storageKey = asset.source?.storageKey || asset.cloudinaryPublicId || asset.cloudinary_public_id || '';
        console.log(`[INGEST_TRACE] Generating signed URL for storageKey: ${storageKey}`);
        
        let signedUrl: string | undefined;
        try {
            signedUrl = getSignedUrl(storageKey, 'raw');
        } catch (e) {
            console.error(`[INGEST_TRACE] Cloudinary getSignedUrl exception for key ${storageKey}:`, e);
        }

        if (!signedUrl) {
            console.error(`[INGEST_TRACE] Failed to generate signed URL for key: ${storageKey}`);
            throw new AppError('EXTERNAL_SERVICE_ERROR', 503, 'No se pudo generar URL firmada de Cloudinary (Verificar API Key)');
        }
        
        console.log(`[INGEST_TRACE] Fetching from signed URL: ${signedUrl.substring(0, 50)}...`);
        const response = await fetch(signedUrl);

        if (!response.ok) {
            console.error(`[INGEST_TRACE] Cloudinary fetch failed with status ${response.status} for URL: ${signedUrl.substring(0, 50)}...`);
            throw new Error(`Cloudinary fetch failed: ${response.status} (Verificar que el archivo exista en Cloudinary)`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        console.log(`[INGEST_TRACE] Cloudinary fetch success (${buffer.length} bytes)`);
        return buffer;
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
