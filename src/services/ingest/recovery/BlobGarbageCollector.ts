import { getErrorMessage } from '@/lib/errors-helpers';
import { logEvento } from '@/lib/logger';
import { IngestAuditService } from '../IngestAuditService';
import { CorrelationIdService } from '@/services/observability/CorrelationIdService';
import { BlobStorageService } from '../../storage/BlobStorageService';

/**
 * 🧹 BlobGarbageCollector
 * Identifies and removes orphaned blobs in storage that are no longer referenced in the database.
 * Phase 290: Automated cleanup and cost optimization.
 */

export interface GCResult {
    blobsIdentified: number;
    blobsDeleted: number;
    spaceRecoveredBytes: number;
    durationMs: number;
    status: 'SUCCESS' | 'PARTIAL_FAILURE';
}

export class BlobGarbageCollector {

    /**
     * Main GC execution.
     * @param session TenantSession for database access
     * @returns GC statistics
     */
    static async execute(session?: import('@/lib/db-tenant').TenantSession): Promise<GCResult> {
        const correlationId = CorrelationIdService.generate();
        const startTime = Date.now();

        await this.logGCStart(correlationId);

        try {
            // 1. Identify Orphaned Blobs (refCount = 0)
            const orphanedBlobs = await BlobStorageService.findOrphanedBlobs(session);
            const identifiedCount = orphanedBlobs.length;
            let deletedCount = 0;
            let recoveredBytes = 0;

            // 2. Process Deletions
            for (const blob of orphanedBlobs) {
                try {
                    await BlobStorageService.deleteOrphanedBlob(blob._id, correlationId, session);
                    deletedCount++;
                    recoveredBytes += blob.sizeBytes || 0;
                } catch (delError) {
                    console.error(`[BLOB_GC] Failed to delete blob ${blob._id}:`, delError);
                }
            }

            const stats: GCResult = {
                blobsIdentified: identifiedCount,
                blobsDeleted: deletedCount,
                spaceRecoveredBytes: recoveredBytes,
                durationMs: Date.now() - startTime,
                status: deletedCount === identifiedCount ? 'SUCCESS' : 'PARTIAL_FAILURE'
            };

            await this.logGCEnd(correlationId, stats);
            return stats;

        } catch (error: unknown) {
            await logEvento({
                level: 'ERROR',
                source: 'BLOB_GC',
                action: 'EXECUTION_FAILED',
                message: `Blob Garbage Collection failed: ${getErrorMessage(error)}`,
                correlationId,
                details: { error: error instanceof Error ? error.stack : undefined }
            });
            return {
                blobsIdentified: 0,
                blobsDeleted: 0,
                spaceRecoveredBytes: 0,
                durationMs: Date.now() - startTime,
                status: 'PARTIAL_FAILURE'
            };
        }
    }

    private static async logGCStart(correlationId: string) {
        await logEvento({
            level: 'INFO',
            source: 'BLOB_GC',
            action: 'GC_STARTED',
            message: 'Starting Blob Garbage Collection cycle.',
            correlationId
        });
    }

    private static async logGCEnd(correlationId: string, stats: GCResult) {
        await logEvento({
            level: 'INFO',
            source: 'BLOB_GC',
            action: 'GC_FINISHED',
            message: `Blob GC cycle complete. Recovered ${(stats.spaceRecoveredBytes / 1024 / 1024).toFixed(2)} MB.`,
            correlationId,
            details: stats
        });
    }
}
