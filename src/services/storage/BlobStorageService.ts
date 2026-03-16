import crypto from 'node:crypto';
import { FileBlobSchema, FileBlob } from '@/lib/schemas/blob';
import { AppError } from '@/lib/errors';
import { ClientSession } from 'mongodb';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { getSystemSession } from '@/lib/sessions/system-session';
import { blobRepository } from '@/lib/repositories/BlobRepository';
import { TenantSession } from '@/lib/db-tenant';

export interface StorageContext {
    tenantId: string;
    userId?: string;
    correlationId: string;
    source: 'RAG_INGEST' | 'USER_DOCS' | 'SYSTEM';
}

/**
 * 🛠️ BlobStorageService - Universal Storage Utility
 * 
 * Provides platform-wide MD5 deduplication and abstraction over storage providers.
 */
export class BlobStorageService {

    /**
     * Calculates MD5 hash for a buffer.
     */
    static calculateHash(buffer: Buffer): string {
        return crypto.createHash('md5').update(buffer).digest('hex');
    }

    /**
     * Registers a physical blob in the platform registry.
     * If the blob already exists (MD5 hit), it increments refCount and returns the existing blob.
     * If not, it uploads the file and creates a new registry entry.
     */
    static async getOrCreateBlob(
        buffer: Buffer,
        metadata: {
            filename: string;
            mimeType: string;
        },
        context: Omit<StorageContext, 'correlationId'> & { correlationId?: string },
        session?: TenantSession
    ): Promise<{ blob: FileBlob; deduplicated: boolean }> {
        return await withCorrelation(
            { level: 'INFO', source: 'BLOB_STORAGE', action: 'GET_OR_CREATE_BLOB', tenantId: context.tenantId, userId: context.userId, correlationId: context.correlationId },
            async ({ log, correlationId }) => {
                const md5 = this.calculateHash(buffer);

                // 🛡️ Global visibility for blobs
                const systemSession = session || getSystemSession();

                // 1. Check for existing blob (Atomic update)
                const existingBlob = await blobRepository.incrementRefCount(md5, systemSession);

                if (existingBlob) {
                    // 🔄 Backward Compatibility: Normalize old field names (Phase 125.1)
                    const legacyBlob = existingBlob as unknown as Record<string, unknown>;
                    const normalizedBlobData = {
                        ...existingBlob,
                        _id: existingBlob._id || (legacyBlob.md5 as string),
                        providerId: existingBlob.providerId || (legacyBlob.cloudinaryPublicId as string),
                        url: existingBlob.url || (legacyBlob.cloudinaryUrl as string),
                        secureUrl: existingBlob.secureUrl || existingBlob.url || (legacyBlob.cloudinaryUrl as string),
                        provider: existingBlob.provider || 'cloudinary',
                        mimeType: existingBlob.mimeType || 'application/pdf',
                        sizeBytes: existingBlob.sizeBytes || 0,
                        refCount: existingBlob.refCount ?? 1,
                        firstSeenAt: (existingBlob.firstSeenAt as unknown as Date) || (legacyBlob.createdAt as Date) || new Date(),
                        lastSeenAt: new Date()
                    };

                    try {
                        const validatedBlob = FileBlobSchema.parse(normalizedBlobData);

                        await log({
                            action: 'BLOB_DEDUPLICATED',
                            message: `Deduplication HIT for MD5: ${md5} (Source: ${context.source})`,
                            details: { 
                                md5, 
                                tenantId: context.tenantId, 
                                source: context.source,
                                providerId: validatedBlob.providerId
                            }
                        });

                        return { blob: validatedBlob, deduplicated: true };
                    } catch (validationError: unknown) {
                        const message = validationError instanceof Error ? validationError.message : 'Unknown validation error';
                        await log({
                            level: 'ERROR',
                            action: 'LEGACY_BLOB_VALIDATION_FAILED',
                            message: `Validación de blob heredado fallida para MD5 ${md5}: ${message}`,
                            details: { md5, error: message }
                        });
                    }
                }

                // 2. Not found - Upload to Provider
                let uploadResult: { publicId: string; secureUrl: string };
                const { uploadRAGDocument, uploadUserDocument } = await import('@/lib/cloudinary');

                try {
                    if (context.source === 'RAG_INGEST') {
                        uploadResult = await uploadRAGDocument(buffer, metadata.filename, context.tenantId, { fileHash: md5 });
                    } else {
                        uploadResult = await uploadUserDocument(buffer, metadata.filename, context.tenantId, context.userId || '000000000000000000000000');
                    }
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : 'Unknown upload error';
                    await log({
                        level: 'ERROR',
                        action: 'UPLOAD_FAILED',
                        message: `Upload to provider failed for ${metadata.filename}: ${message}`,
                        details: { md5, tenantId: context.tenantId, error: message }
                    });
                    throw new AppError('EXTERNAL_SERVICE_ERROR', 502, `Storage provider error: ${message}`);
                }

                // 3. Register new blob
                const newBlobData = {
                    _id: md5,
                    provider: 'cloudinary' as const,
                    providerId: uploadResult.publicId,
                    url: uploadResult.secureUrl,
                    secureUrl: uploadResult.secureUrl,
                    mimeType: metadata.mimeType,
                    sizeBytes: buffer.length,
                    refCount: 1,
                    tenantId: '000000000000000000000000',
                    firstSeenAt: new Date(),
                    lastSeenAt: new Date(),
                    metadata: {
                        originalFilename: metadata.filename,
                        uploadedBy: context.userId,
                        source: context.source
                    }
                };

                const validatedBlob = FileBlobSchema.parse(newBlobData);

                try {
                    await blobRepository.create(validatedBlob as any, systemSession);
                } catch (insertError: unknown) {
                    const mongoErr = insertError as { code?: number; message?: string };
                    if (mongoErr.code === 11000 || mongoErr.message?.includes('E11000')) {
                        await log({
                            level: 'WARN',
                            action: 'INSERT_CONFLICT_RECOVERY',
                            message: `Conflict detected for MD5 ${md5}. Record was created by another process or legacy exists. Recovering...`,
                        });

                        await blobRepository.update(md5, { $set: validatedBlob } as any, systemSession);
                        return { blob: validatedBlob, deduplicated: false };
                    }
                    throw insertError;
                }

                await log({
                    action: 'BLOB_REGISTERED',
                    message: `New blob registered for MD5: ${md5} (Source: ${context.source})`,
                    details: { md5, providerId: uploadResult.publicId }
                });

                return { blob: validatedBlob, deduplicated: false };
            }
        );
    }

    /**
     * Decrements the reference count of a blob.
     */
    static async unregisterBlob(md5: string, session?: TenantSession): Promise<void> {
        await blobRepository.decrementRefCount(md5, session || getSystemSession());
    }

    /**
     * Find orphaned blobs (refCount = 0)
     * Used by garbage collection job
     */
    static async findOrphanedBlobs(session?: TenantSession): Promise<FileBlob[]> {
        return await blobRepository.findOrphaned(session || getSystemSession());
    }

    /**
     * Delete orphaned blob (garbage collection)
     */
    static async deleteOrphanedBlob(
        md5: string,
        correlationId: string,
        session?: TenantSession
    ): Promise<void> {
        return await withCorrelation(
            { level: 'INFO', source: 'BLOB_STORAGE', action: 'DELETE_ORPHANED_BLOB', correlationId },
            async ({ log }) => {
                const systemSession = session || getSystemSession();
                const blob = await blobRepository.findByMd5(md5, systemSession);

                if (!blob || blob.refCount > 0) return;

                // Delete from Physical Provider
                if (blob.provider === 'cloudinary') {
                    const { deleteFromCloudinary } = await import('@/lib/cloudinary');
                    await deleteFromCloudinary(blob.providerId);
                } else if (blob.provider === 'gridfs') {
                    const { GridFSUtils } = await import('@/lib/gridfs-utils');
                    await GridFSUtils.deleteFile(blob.providerId, correlationId);
                }

                // Delete blob record
                await blobRepository.deleteEntity(md5, systemSession, true);

                await log({
                    action: 'BLOB_DELETED_GC',
                    message: `Orphaned blob deleted (MD5: ${md5}) - freed ${blob.sizeBytes} bytes`,
                    details: { md5, freedBytes: blob.sizeBytes }
                });
            }
        );
    }
}
