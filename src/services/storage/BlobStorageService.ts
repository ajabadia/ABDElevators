import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { FileBlobSchema, FileBlob } from '@/lib/schemas/blob';
import crypto from 'crypto';
import { AppError } from '@/lib/errors';

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
        context: StorageContext,
        session?: any
    ): Promise<{ blob: FileBlob; deduplicated: boolean }> {
        const md5 = this.calculateHash(buffer);
        const correlationId = context.correlationId;

        // 🛡️ Global visibility for blobs (Force SUPER_ADMIN to avoid tenantId override in SecureCollection)
        const blobsCollection = await getTenantCollection('file_blobs', {
            ...session,
            user: {
                ...(session?.user || {}),
                tenantId: 'platform_master',
                role: 'SUPER_ADMIN' // 🚨 Crucial: SecureCollection respects tenantId if role is SUPER_ADMIN
            }
        });

        // 1. Check for existing blob (Atomic update)
        // Ensure atomic result is handled correctly based on driver version
        const findResult = await blobsCollection.findOneAndUpdate(
            { _id: md5 as any },
            {
                $inc: { refCount: 1 },
                $set: { lastSeenAt: new Date() }
            },
            {
                returnDocument: 'after',
                session: session?.session
            }
        );

        // Normalize MongoDB ModifyResult vs Direct Document
        const existingBlob = (findResult as any)?.value !== undefined
            ? (findResult as any).value
            : findResult;

        if (existingBlob) {
            // 🔄 Backward Compatibility: Normalize old field names (Phase 125.1)
            const normalizedBlobData = {
                ...existingBlob,
                _id: existingBlob._id || (existingBlob as any).md5, // Support old MD5 field if necessary
                providerId: existingBlob.providerId || (existingBlob as any).cloudinaryPublicId,
                url: existingBlob.url || (existingBlob as any).cloudinaryUrl,
                secureUrl: existingBlob.secureUrl || existingBlob.url || (existingBlob as any).cloudinaryUrl,
                provider: existingBlob.provider || 'cloudinary',
                // Default required fields if missing in legacy records
                mimeType: existingBlob.mimeType || 'application/pdf',
                sizeBytes: existingBlob.sizeBytes || 0,
                refCount: existingBlob.refCount ?? 1,
                firstSeenAt: existingBlob.firstSeenAt || existingBlob.createdAt || new Date(),
                lastSeenAt: new Date()
            };

            try {
                console.log(`[BLOB_STORAGE] Normalizing legacy blob ${md5}:`, {
                    hasCloudinaryPublicId: !!(existingBlob as any).cloudinaryPublicId,
                    hasProviderId: !!existingBlob.providerId
                });

                const validatedBlob = FileBlobSchema.parse(normalizedBlobData);

                console.log(`[BLOB_STORAGE] Validated deduplicated blob ${md5}:`, {
                    providerId: validatedBlob.providerId,
                    url: validatedBlob.url,
                    fields: Object.keys(validatedBlob)
                });

                await logEvento({
                    level: 'INFO',
                    source: 'BLOB_STORAGE',
                    action: 'BLOB_DEDUPLICATED',
                    message: `Deduplication HIT for MD5: ${md5} (Source: ${context.source})`,
                    correlationId,
                    details: { md5, tenantId: context.tenantId, source: context.source }
                });

                return { blob: validatedBlob, deduplicated: true };
            } catch (validationError: any) {
                console.error(`[BLOB_STORAGE] Legacy blob validation failed for MD5 ${md5}:`, validationError.issues);
                // Fallthrough to re-upload if legacy record is too corrupted to use
                await logEvento({
                    level: 'WARN',
                    source: 'BLOB_STORAGE',
                    action: 'LEGACY_BLOB_CORRUPTED',
                    message: `Existing blob ${md5} is corrupted, forcing re-upload: ${validationError.message}`,
                    correlationId
                });
            }
        }

        // 2. Not found - Upload to Provider (Cloudinary by default for now)
        // Note: For now we use the existing Cloudinary utility based on context
        let uploadResult;
        const { uploadRAGDocument, uploadUserDocument } = await import('@/lib/cloudinary');

        try {
            if (context.source === 'RAG_INGEST') {
                uploadResult = await uploadRAGDocument(buffer, metadata.filename, context.tenantId, { fileHash: md5 });
            } else {
                // USER_DOCS or SYSTEM
                uploadResult = await uploadUserDocument(buffer, metadata.filename, context.tenantId, context.userId || 'system');
            }
        } catch (error: any) {
            await logEvento({
                level: 'ERROR',
                source: 'BLOB_STORAGE',
                action: 'UPLOAD_FAILED',
                message: `Upload to provider failed for ${metadata.filename}: ${error.message}`,
                correlationId,
                details: { md5, tenantId: context.tenantId, error: error.message }
            });
            throw new AppError('EXTERNAL_SERVICE_ERROR', 502, `Storage provider error: ${error.message}`);
        }

        // 3. Register new blob
        const newBlobData = {
            _id: md5,
            provider: 'cloudinary',
            providerId: uploadResult.publicId,
            url: uploadResult.secureUrl,
            secureUrl: uploadResult.secureUrl,
            mimeType: metadata.mimeType,
            sizeBytes: buffer.length,
            refCount: 1,
            tenantId: 'abd_global',
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
            // Cast to any to avoid ObjectId vs string _id linting issues
            await blobsCollection.insertOne(validatedBlob as any, { session: session?.session });
        } catch (insertError: any) {
            // 🛡️ Conflict Resolution (Rule #7 Atomic Operations)
            if (insertError.code === 11000 || insertError.message?.includes('E11000')) {
                await logEvento({
                    level: 'WARN',
                    source: 'BLOB_STORAGE',
                    action: 'INSERT_CONFLICT_RECOVERY',
                    message: `Conflict detected for MD5 ${md5}. Record was created by another process or legacy exists. Recovering...`,
                    correlationId
                });

                // Conflict means it was just created or already existed. 
                // We overwrite with the latest valid data since we've already uploaded.
                await blobsCollection.updateOne(
                    { _id: md5 as any },
                    { $set: validatedBlob as any },
                    { session: session?.session }
                );

                return { blob: validatedBlob, deduplicated: false };
            }
            throw insertError;
        }

        await logEvento({
            level: 'INFO',
            source: 'BLOB_STORAGE',
            action: 'BLOB_REGISTERED',
            message: `New blob registered for MD5: ${md5} (Source: ${context.source})`,
            correlationId,
            details: { md5, providerId: uploadResult.publicId }
        });

        return { blob: validatedBlob, deduplicated: false };
    }

    /**
     * Decrements the reference count of a blob.
     */
    static async unregisterBlob(md5: string, session?: any): Promise<void> {
        const blobsCollection = await getTenantCollection('file_blobs', {
            ...session,
            user: {
                ...(session?.user || {}),
                tenantId: 'platform_master',
                role: 'SUPER_ADMIN'
            }
        });

        await blobsCollection.updateOne(
            { _id: md5 as any },
            { $inc: { refCount: -1 } },
            { session: session?.session }
        );
    }

    /**
     * Find orphaned blobs (refCount = 0)
     * 
     * Used by garbage collection job
     */
    static async findOrphanedBlobs(session?: any): Promise<FileBlob[]> {
        const blobsCollection = await getTenantCollection('file_blobs', {
            ...session,
            user: {
                ...(session?.user || {}),
                tenantId: 'platform_master',
                role: 'SUPER_ADMIN'
            },
        });

        const orphans = await blobsCollection
            .find({ refCount: 0 });

        return orphans as unknown as FileBlob[];
    }

    /**
     * Delete orphaned blob (garbage collection)
     */
    static async deleteOrphanedBlob(
        md5: string,
        correlationId: string,
        session?: any
    ): Promise<void> {
        const blobsCollection = await getTenantCollection('file_blobs', {
            ...session,
            user: {
                ...(session?.user || {}),
                tenantId: 'platform_master',
                role: 'SUPER_ADMIN'
            },
        });

        const blob = await blobsCollection.findOne({ _id: md5 as any });
        if (!blob || blob.refCount > 0) {
            // Not orphaned, skip
            return;
        }

        // Delete from Physical Provider
        if (blob.provider === 'cloudinary') {
            const { deleteFromCloudinary } = await import('@/lib/cloudinary');
            await deleteFromCloudinary(blob.providerId);
        } else if (blob.provider === 'gridfs') {
            const { GridFSUtils } = await import('@/lib/gridfs-utils');
            await GridFSUtils.deleteFile(blob.providerId, correlationId);
        }

        // Delete blob record
        await blobsCollection.deleteOne({ _id: md5 as any }, { session: session?.session });

        await logEvento({
            level: 'INFO',
            source: 'BLOB_STORAGE',
            action: 'BLOB_DELETED_GC',
            message: `Orphaned blob deleted (MD5: ${md5}) - freed ${blob.sizeBytes} bytes`,
            correlationId,
            details: {
                md5,
                freedBytes: blob.sizeBytes,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
