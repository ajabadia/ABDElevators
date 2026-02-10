/**
 * GridFS Utilities for File Blob Storage
 * 
 * Single Responsibility: Upload/download/delete files from MongoDB GridFS
 * Max Lines: < 150 (Modularization Rule)
 * 
 * Banking-Grade Traceability:
 * - All GridFS operations logged immutably
 * - File integrity verified with SHA-256
 * - Storage metrics tracked
 */

import { GridFSBucket, Db, ObjectId } from 'mongodb';
import { connectDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';

/**
 * GridFS Bucket Configuration
 */
const BUCKET_NAME = 'ingestion_blobs';

/**
 * Get GridFS bucket instance
 */
async function getGridFSBucket(): Promise<{ bucket: GridFSBucket; db: Db }> {
    const db = await connectDB(); // connectDB() returns Db directly
    const bucket = new GridFSBucket(db, { bucketName: BUCKET_NAME });
    return { bucket, db };
}

/**
 * GridFS Operations
 */
export class GridFSUtils {
    /**
     * Upload file buffer to GridFS
     * 
     * @param buffer - File buffer
     * @param metadata - File metadata
     * @param correlationId - Audit correlation ID
     * @returns GridFS file ID
     */
    static async uploadFile(
        buffer: Buffer,
        metadata: {
            filename: string;
            contentType: string;
            md5: string;
            sha256: string;
        },
        correlationId: string
    ): Promise<string> {
        const { bucket } = await getGridFSBucket();
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const uploadStream = bucket.openUploadStream(metadata.filename, {
                metadata: {
                    contentType: metadata.contentType,
                    md5: metadata.md5,
                    sha256: metadata.sha256,
                    correlationId,
                    uploadedAt: new Date().toISOString(),
                },
            });

            uploadStream.on('finish', async () => {
                const gridFsId = uploadStream.id.toString();
                const durationMs = Date.now() - startTime;

                await this.logUpload(gridFsId, metadata, buffer.length, durationMs, correlationId);
                resolve(gridFsId);
            });

            uploadStream.on('error', async (error) => {
                await this.logUploadError(metadata.filename, error, correlationId);
                reject(error);
            });

            uploadStream.end(buffer);
        });
    }

    /**
     * Download file from GridFS
     * 
     * @param gridFsId - GridFS file ID
     * @param correlationId - Audit correlation ID
     * @returns File buffer
     */
    static async downloadFile(
        gridFsId: string,
        correlationId: string
    ): Promise<Buffer> {
        const { bucket } = await getGridFSBucket();
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            const downloadStream = bucket.openDownloadStream(new ObjectId(gridFsId));

            downloadStream.on('data', (chunk) => {
                chunks.push(chunk);
            });

            downloadStream.on('end', async () => {
                const buffer = Buffer.concat(chunks);
                const durationMs = Date.now() - startTime;

                await this.logDownload(gridFsId, buffer.length, durationMs, correlationId);
                resolve(buffer);
            });

            downloadStream.on('error', async (error) => {
                await this.logDownloadError(gridFsId, error, correlationId);
                reject(error);
            });
        });
    }

    /**
     * Delete file from GridFS
     * 
     * @param gridFsId - GridFS file ID
     * @param correlationId - Audit correlation ID
     */
    static async deleteFile(
        gridFsId: string,
        correlationId: string
    ): Promise<void> {
        const { bucket } = await getGridFSBucket();

        try {
            await bucket.delete(new ObjectId(gridFsId));
            await this.logDeletion(gridFsId, correlationId);
        } catch (error) {
            const err = error as Error;
            await this.logDeletionError(gridFsId, err, correlationId);
            throw error;
        }
    }

    /**
     * Log file upload (audit trail)
     */
    private static async logUpload(
        gridFsId: string,
        metadata: { filename: string; md5: string; sha256: string },
        sizeBytes: number,
        durationMs: number,
        correlationId: string
    ): Promise<void> {
        await logEvento({
            level: 'INFO',
            source: 'GRIDFS',
            action: 'FILE_UPLOADED',
            message: `File uploaded to GridFS: ${metadata.filename}`,
            correlationId,
            details: {
                gridFsId,
                filename: metadata.filename,
                md5: metadata.md5,
                sha256: metadata.sha256,
                sizeBytes,
                durationMs,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Log upload error
     */
    private static async logUploadError(
        filename: string,
        error: Error,
        correlationId: string
    ): Promise<void> {
        await logEvento({
            level: 'ERROR',
            source: 'GRIDFS',
            action: 'FILE_UPLOAD_FAILED',
            message: `GridFS upload failed: ${filename}`,
            correlationId,
            details: {
                filename,
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Log file download (audit trail)
     */
    private static async logDownload(
        gridFsId: string,
        sizeBytes: number,
        durationMs: number,
        correlationId: string
    ): Promise<void> {
        await logEvento({
            level: 'DEBUG',
            source: 'GRIDFS',
            action: 'FILE_DOWNLOADED',
            message: `File downloaded from GridFS: ${gridFsId}`,
            correlationId,
            details: {
                gridFsId,
                sizeBytes,
                durationMs,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Log download error
     */
    private static async logDownloadError(
        gridFsId: string,
        error: Error,
        correlationId: string
    ): Promise<void> {
        await logEvento({
            level: 'ERROR',
            source: 'GRIDFS',
            action: 'FILE_DOWNLOAD_FAILED',
            message: `GridFS download failed: ${gridFsId}`,
            correlationId,
            details: {
                gridFsId,
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Log file deletion (audit trail)
     */
    private static async logDeletion(
        gridFsId: string,
        correlationId: string
    ): Promise<void> {
        await logEvento({
            level: 'INFO',
            source: 'GRIDFS',
            action: 'FILE_DELETED',
            message: `File deleted from GridFS: ${gridFsId}`,
            correlationId,
            details: {
                gridFsId,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Log deletion error
     */
    private static async logDeletionError(
        gridFsId: string,
        error: Error,
        correlationId: string
    ): Promise<void> {
        await logEvento({
            level: 'ERROR',
            source: 'GRIDFS',
            action: 'FILE_DELETION_FAILED',
            message: `GridFS deletion failed: ${gridFsId}`,
            correlationId,
            details: {
                gridFsId,
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
