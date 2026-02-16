/**
 * Garbage Collection Job for Orphaned File Blobs
 * 
 * Single Responsibility: Clean up unreferenced blobs from storage
 * Max Lines: < 150 (Modularization Rule)
 * 
 * Banking-Grade Traceability:
 * - All GC operations logged immutably
 * - Deleted blobs preserved in audit log
 * - Storage savings tracked and reported
 */

import { logEvento } from '@/lib/logger';
import { BlobStorageService } from '../../storage/BlobStorageService';
import crypto from 'crypto';

/**
 * Garbage Collection Configuration
 */
const GC_CONFIG = {
    BATCH_SIZE: 100, // Process 100 orphans per batch
    GRACE_PERIOD_MS: 24 * 60 * 60 * 1000, // 24 hours (don't delete recent orphans)
    MAX_EXECUTION_TIME_MS: 5 * 60 * 1000, // 5 minutes max runtime
};

/**
 * GC Job Result
 */
export interface GCResult {
    orphansFound: number;
    orphansDeleted: number;
    bytesFreed: number;
    durationMs: number;
    errors: number;
}

/**
 * Garbage Collector for File Blobs
 * 
 * Purpose: Clean up orphaned blobs (refCount = 0) after grace period
 * Schedule: Run daily via cron job
 * Safety: Uses grace period to prevent premature deletion
 */
export class BlobGarbageCollector {
    /**
     * Execute garbage collection
     * 
     * @param session - Admin session for DB access
     * @returns GC statistics
     */
    static async execute(session: any): Promise<GCResult> {
        const correlationId = crypto.randomUUID();
        const startTime = Date.now();

        await this.logGCStart(correlationId);

        let orphansFound = 0;
        let orphansDeleted = 0;
        let bytesFreed = 0;
        let errors = 0;

        try {
            // Find all orphaned blobs
            const orphans = await BlobStorageService.findOrphanedBlobs(session);
            orphansFound = orphans.length;

            await this.logOrphansFound(correlationId, orphansFound);

            // Filter by grace period
            const now = Date.now();
            const deletableBlobs = orphans.filter((blob) => {
                const age = now - blob.lastSeenAt.getTime();
                return age > GC_CONFIG.GRACE_PERIOD_MS;
            });

            await this.logDeletableBlobsFound(correlationId, deletableBlobs.length, orphansFound);

            // Delete in batches (respecting execution time limit)
            for (let i = 0; i < deletableBlobs.length; i++) {
                // Check execution time limit
                if (Date.now() - startTime > GC_CONFIG.MAX_EXECUTION_TIME_MS) {
                    await this.logGCTimeout(correlationId, i, deletableBlobs.length);
                    break;
                }

                const blob = deletableBlobs[i];

                try {
                    await BlobStorageService.deleteOrphanedBlob(
                        blob._id,
                        correlationId,
                        session
                    );
                    orphansDeleted++;
                    bytesFreed += blob.sizeBytes;
                } catch (error) {
                    errors++;
                    const err = error as Error;
                    await this.logGCError(correlationId, blob._id, err);
                }
            }

            const result: GCResult = {
                orphansFound,
                orphansDeleted,
                bytesFreed,
                durationMs: Date.now() - startTime,
                errors,
            };

            await this.logGCCompletion(correlationId, result);

            return result;
        } catch (error) {
            const err = error as Error;
            await this.logGCFatalError(correlationId, err);
            throw error;
        }
    }

    /**
     * Log GC start (audit trail)
     */
    private static async logGCStart(correlationId: string): Promise<void> {
        await logEvento({
            level: 'INFO',
            source: 'BLOB_GC',
            action: 'GC_STARTED',
            message: 'Garbage collection job started',
            correlationId,
            details: {
                gracePeriodMs: GC_CONFIG.GRACE_PERIOD_MS,
                maxExecutionTimeMs: GC_CONFIG.MAX_EXECUTION_TIME_MS,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Log orphans found
     */
    private static async logOrphansFound(
        correlationId: string,
        count: number
    ): Promise<void> {
        await logEvento({
            level: 'INFO',
            source: 'BLOB_GC',
            action: 'ORPHANS_FOUND',
            message: `Found ${count} orphaned blobs`,
            correlationId,
            details: {
                orphanCount: count,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Log deletable blobs found (after grace period filter)
     */
    private static async logDeletableBlobsFound(
        correlationId: string,
        deletable: number,
        total: number
    ): Promise<void> {
        await logEvento({
            level: 'INFO',
            source: 'BLOB_GC',
            action: 'DELETABLE_BLOBS_FOUND',
            message: `${deletable} of ${total} orphans are deletable (grace period passed)`,
            correlationId,
            details: {
                deletableCount: deletable,
                totalOrphans: total,
                gracePeriodMs: GC_CONFIG.GRACE_PERIOD_MS,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Log GC timeout
     */
    private static async logGCTimeout(
        correlationId: string,
        processed: number,
        total: number
    ): Promise<void> {
        await logEvento({
            level: 'WARN',
            source: 'BLOB_GC',
            action: 'GC_TIMEOUT',
            message: `GC job timed out after processing ${processed}/${total} blobs`,
            correlationId,
            details: {
                processedCount: processed,
                totalCount: total,
                maxExecutionTimeMs: GC_CONFIG.MAX_EXECUTION_TIME_MS,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Log GC error (individual blob)
     */
    private static async logGCError(
        correlationId: string,
        md5: string,
        error: Error
    ): Promise<void> {
        await logEvento({
            level: 'ERROR',
            source: 'BLOB_GC',
            action: 'GC_DELETE_ERROR',
            message: `Failed to delete orphaned blob (MD5: ${md5}): ${error.message}`,
            correlationId,
            details: {
                md5,
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Log GC completion (audit trail)
     */
    private static async logGCCompletion(
        correlationId: string,
        result: GCResult
    ): Promise<void> {
        await logEvento({
            level: 'INFO',
            source: 'BLOB_GC',
            action: 'GC_COMPLETED',
            message: `GC completed: ${result.orphansDeleted} blobs deleted, ${result.bytesFreed} bytes freed`,
            correlationId,
            details: {
                ...result,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Log GC fatal error
     */
    private static async logGCFatalError(
        correlationId: string,
        error: Error
    ): Promise<void> {
        await logEvento({
            level: 'ERROR',
            source: 'BLOB_GC',
            action: 'GC_FATAL_ERROR',
            message: `GC job failed: ${error.message}`,
            correlationId,
            details: {
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
