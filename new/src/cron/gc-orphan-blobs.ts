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
import { logEvento } from '@/lib/logger';
import { auth } from '@/lib/auth';

/**
 * Execute garbage collection job
 * 
 * Called by cron scheduler or manual admin trigger
 */
export async function executeGarbageCollection() {
    const correlationId = `gc-${Date.now()}`;

    try {
        // Get admin session for DB access
        const session = await auth();
        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            throw new Error('GC job requires SUPER_ADMIN session');
        }

        await logEvento({
            level: 'INFO',
            source: 'CRON_GC',
            action: 'GC_JOB_STARTED',
            message: 'Garbage collection cron job started',
            correlationId,
            details: {
                timestamp: new Date().toISOString(),
            },
        });

        // Execute GC
        const result = await BlobGarbageCollector.execute(session);

        // Log result
        await logEvento({
            level: 'INFO',
            source: 'CRON_GC',
            action: 'GC_JOB_COMPLETED',
            message: `GC job completed: ${result.orphansDeleted} blobs deleted, ${(result.bytesFreed / 1024 / 1024).toFixed(2)} MB freed`,
            correlationId,
            details: {
                ...result,
                bytesMB: (result.bytesFreed / 1024 / 1024).toFixed(2),
                timestamp: new Date().toISOString(),
            },
        });

        return result;
    } catch (error) {
        const err = error as Error;

        // Log fatal error
        await logEvento({
            level: 'ERROR',
            source: 'CRON_GC',
            action: 'GC_JOB_FAILED',
            message: `GC cron job failed: ${err.message}`,
            correlationId,
            details: {
                errorName: err.name,
                errorMessage: err.message,
                errorStack: err.stack,
                timestamp: new Date().toISOString(),
            },
        });

        throw error;
    }
}

// Cron schedule: Daily at 2:00 AM (example using node-cron or similar)
// cron.schedule('0 2 * * *', executeGarbageCollection);
