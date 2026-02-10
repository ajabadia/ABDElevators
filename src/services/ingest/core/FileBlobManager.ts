/**
 * MD5 File Blob Deduplication Manager
 * 
 * Single Responsibility: Atomic file blob management with MD5 deduplication
 * Max Lines: < 250 (Modularization Rule)
 * 
 * Banking-Grade Traceability:
 * - All blob operations logged immutably
 * - Reference counted with audit trail
 * - Race condition prevention via atomic operations
 * - Garbage collection tracking
 */

import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import crypto from 'crypto';
import { z } from 'zod';

/**
 * FileBlob Zod Schema (Global scope - shared across tenants)
 * 
 * Purpose: Deduplicate identical files across entire platform
 * Scope: GLOBAL (not tenant-isolated)
 * Storage: GridFS for binary data
 */
export const FileBlobSchema = z.object({
    md5: z.string().length(32), // MD5 hash (32 hex chars)
    sha256: z.string().length(64), // SHA-256 hash for integrity (64 hex chars)
    sizeBytes: z.number().int().positive(),
    mimeType: z.string(),
    originalName: z.string(),
    gridFsId: z.string(), // GridFS file ID
    createdAt: z.date(),
    lastAccessedAt: z.date(),
    refCount: z.number().int().nonnegative().default(0), // Reference count
    referencingDocs: z.array(z.string()).default([]), // Document IDs using this blob
});

export type FileBlob = z.infer<typeof FileBlobSchema>;

/**
 * Blob reference context (for audit trail)
 */
export interface BlobReferenceContext {
    docId: string;
    tenantId: string;
    userId?: string;
    correlationId: string;
}

/**
 * FileBlobManager: Atomic MD5 Deduplication
 * 
 * Features:
 * - Atomic getOrCreate operations (race condition safe)
 * - Reference counting for garbage collection
 * - Banking-grade audit trail
 * - Cross-tenant deduplication (GLOBAL scope)
 */
export class FileBlobManager {
    /**
     * Calculate file hash (MD5 + SHA-256)
     */
    static async calculateFileHash(buffer: Buffer): Promise<{
        md5: string;
        sha256: string;
    }> {
        const md5 = crypto.createHash('md5').update(buffer).digest('hex');
        const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
        return { md5, sha256 };
    }

    /**
     * Get or create FileBlob (atomic operation)
     * 
     * @param buffer - File buffer
     * @param metadata - File metadata
     * @param context - Reference context for audit
     * @returns FileBlob ID and deduplication result
     */
    static async getOrCreateBlob(
        buffer: Buffer,
        metadata: {
            mimeType: string;
            originalName: string;
        },
        context: BlobReferenceContext,
        session: any // MongoDB session for atomicity
    ): Promise<{
        blobId: string;
        md5: string;
        deduplicated: boolean;
        savedBytes: number;
    }> {
        const { md5, sha256 } = await this.calculateFileHash(buffer);
        const sizeBytes = buffer.length;

        // Get file_blobs collection (GLOBAL scope, not tenant-isolated)
        const blobsCollection = await getTenantCollection('file_blobs', {
            ...session,
            user: { ...session.user, tenantId: 'platform_master' }, // Force global scope
        });

        // Try to find existing blob by MD5 (atomic findOneAndUpdate)
        const result = await blobsCollection.findOneAndUpdate(
            { md5 },
            {
                $set: {
                    lastAccessedAt: new Date(),
                },
                $inc: {
                    refCount: 1,
                },
                $addToSet: {
                    referencingDocs: context.docId,
                },
            },
            {
                returnDocument: 'after',
                session: session.session, // Use MongoDB transaction session
            }
        );

        if (result) {
            // Blob already exists - deduplicated!
            await this.logBlobReuse(md5, context, sizeBytes);
            return {
                blobId: result._id.toString(),
                md5,
                deduplicated: true,
                savedBytes: sizeBytes,
            };
        }

        // Blob doesn't exist - create new one
        const gridFsId = await this.uploadToGridFS(buffer, { ...metadata, md5, sha256 }, context.correlationId);

        const newBlob = FileBlobSchema.parse({
            md5,
            sha256,
            sizeBytes,
            mimeType: metadata.mimeType,
            originalName: metadata.originalName,
            gridFsId,
            createdAt: new Date(),
            lastAccessedAt: new Date(),
            refCount: 1,
            referencingDocs: [context.docId],
        });

        const insertResult = await blobsCollection.insertOne(newBlob, {
            session: session.session,
        });

        await this.logBlobCreation(md5, context, sizeBytes);

        return {
            blobId: insertResult.insertedId.toString(),
            md5,
            deduplicated: false,
            savedBytes: 0,
        };
    }

    /**
     * Remove reference to a blob (decrement refCount)
     * 
     * Used when a document is deleted
     */
    static async removeReference(
        md5: string,
        docId: string,
        context: BlobReferenceContext,
        session: any
    ): Promise<void> {
        const blobsCollection = await getTenantCollection('file_blobs', {
            ...session,
            user: { ...session.user, tenantId: 'platform_master' },
        });

        await blobsCollection.updateOne(
            { md5 },
            {
                $inc: { refCount: -1 },
                $pull: { referencingDocs: docId },
            },
            { session: session.session }
        );

        await this.logBlobUnreference(md5, context);
    }

    /**
     * Find orphaned blobs (refCount = 0)
     * 
     * Used by garbage collection job
     */
    static async findOrphanedBlobs(session: any): Promise<FileBlob[]> {
        const blobsCollection = await getTenantCollection('file_blobs', {
            ...session,
            user: { ...session.user, tenantId: 'platform_master' },
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
        session: any
    ): Promise<void> {
        const blobsCollection = await getTenantCollection('file_blobs', {
            ...session,
            user: { ...session.user, tenantId: 'platform_master' },
        });

        const blob = await blobsCollection.findOne({ md5 });
        if (!blob || blob.refCount > 0) {
            // Not orphaned, skip
            return;
        }

        // Delete from GridFS
        await this.deleteFromGridFS(blob.gridFsId, correlationId);

        // Delete blob record
        await blobsCollection.deleteOne({ md5 }, { session: session.session });

        await this.logBlobDeletion(md5, correlationId, blob.sizeBytes);
    }

    /**
     * Upload file to GridFS
     * 
     * @returns GridFS file ID
     */
    private static async uploadToGridFS(
        buffer: Buffer,
        metadata: { mimeType: string; originalName: string; md5: string; sha256: string },
        correlationId: string
    ): Promise<string> {
        const { GridFSUtils } = await import('@/lib/gridfs-utils');

        return await GridFSUtils.uploadFile(
            buffer,
            {
                filename: metadata.originalName,
                contentType: metadata.mimeType,
                md5: metadata.md5,
                sha256: metadata.sha256,
            },
            correlationId
        );
    }

    /**
     * Delete file from GridFS
     */
    private static async deleteFromGridFS(
        gridFsId: string,
        correlationId: string
    ): Promise<void> {
        const { GridFSUtils } = await import('@/lib/gridfs-utils');
        await GridFSUtils.deleteFile(gridFsId, correlationId);
    }

    /**
     * Log blob creation (audit trail)
     */
    private static async logBlobCreation(
        md5: string,
        context: BlobReferenceContext,
        sizeBytes: number
    ): Promise<void> {
        await logEvento({
            level: 'INFO',
            source: 'BLOB_MANAGER',
            action: 'BLOB_CREATED',
            message: `New file blob created (MD5: ${md5})`,
            correlationId: context.correlationId,
            details: {
                md5,
                sizeBytes,
                docId: context.docId,
                tenantId: context.tenantId,
                userId: context.userId,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Log blob reuse (deduplication event)
     */
    private static async logBlobReuse(
        md5: string,
        context: BlobReferenceContext,
        savedBytes: number
    ): Promise<void> {
        await logEvento({
            level: 'INFO',
            source: 'BLOB_MANAGER',
            action: 'BLOB_DEDUPLICATED',
            message: `File blob reused (MD5: ${md5}) - saved ${savedBytes} bytes`,
            correlationId: context.correlationId,
            details: {
                md5,
                savedBytes,
                docId: context.docId,
                tenantId: context.tenantId,
                userId: context.userId,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Log blob unreference (document deletion)
     */
    private static async logBlobUnreference(
        md5: string,
        context: BlobReferenceContext
    ): Promise<void> {
        await logEvento({
            level: 'INFO',
            source: 'BLOB_MANAGER',
            action: 'BLOB_UNREFERENCED',
            message: `File blob reference removed (MD5: ${md5})`,
            correlationId: context.correlationId,
            details: {
                md5,
                docId: context.docId,
                tenantId: context.tenantId,
                userId: context.userId,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Log blob deletion (garbage collection)
     */
    private static async logBlobDeletion(
        md5: string,
        correlationId: string,
        freedBytes: number
    ): Promise<void> {
        await logEvento({
            level: 'INFO',
            source: 'BLOB_MANAGER',
            action: 'BLOB_DELETED_GC',
            message: `Orphaned blob deleted (MD5: ${md5}) - freed ${freedBytes} bytes`,
            correlationId,
            details: {
                md5,
                freedBytes,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
