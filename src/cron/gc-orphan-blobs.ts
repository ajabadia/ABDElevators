/**
 * Cron Job: Blob Garbage Collection
 * 
 * Schedule: Daily at 2:00 AM
 * Purpose: Clean up orphaned file blobs (refCount = 0)
 * 
 * Banking-Grade Audit:
 * - All GC executions logged immutably
 * - Storage savings tracked and reported
 * - Errors escalated to administrators
 */

import { BlobGarbageCollector } from '@/services/ingest/recovery/BlobGarbageCollector';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { getSystemSession } from '@/lib/sessions/system-session';

/**
 * Execute garbage collection job
 */
export async function executeGarbageCollection() {
    return await withCorrelation(
        { level: 'INFO', source: 'CRON_GC', action: 'GC_EXECUTION' },
        async ({ log }) => {
            try {
                // Use system session for platform-wide GC
                const session = getSystemSession('platform_master');

                await log({
                    action: 'START',
                    message: 'Garbage collection cron job started'
                });

                // Execute GC
                const result = await BlobGarbageCollector.execute(session as any);

                // Log result
                await log({
                    action: 'COMPLETED',
                    message: `GC job completed: ${result.orphansDeleted} blobs deleted, ${(result.bytesFreed / 1024 / 1024).toFixed(2)} MB freed`,
                    details: {
                        ...result,
                        bytesMB: (result.bytesFreed / 1024 / 1024).toFixed(2)
                    },
                });

                return result;
            } catch (error) {
                const err = error as Error;
                await log({
                    level: 'ERROR',
                    action: 'FAILED',
                    message: `GC cron job failed: ${err.message}`,
                    details: { errorName: err.name, errorMessage: err.message, errorStack: err.stack }
                });
                throw error;
            }
        }
    );
}

// Cron schedule: Daily at 2:00 AM (example using node-cron or similar)
// cron.schedule('0 2 * * *', executeGarbageCollection);
