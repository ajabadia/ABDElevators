import { ingestionQueue } from './simple-queue';
import { IngestService } from '@/services/ingest/IngestService';
import { logEvento } from './logger';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables for standalone execution
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

/**
 * Simple worker that processes ingestion jobs from the in-memory queue
 * Runs every 5 seconds to check for pending jobs
 */

let isProcessing = false;
let processorInterval: NodeJS.Timeout | null = null;

async function processNextJob() {
    // Prevent concurrent processing
    if (isProcessing) {
        return;
    }

    const job = ingestionQueue.getNext();
    if (!job) {
        return; // No pending jobs
    }

    isProcessing = true;

    await logEvento({
        level: 'INFO',
        source: 'SIMPLE_WORKER',
        action: 'JOB_START',
        message: `Processing job: ${job.docId}`,
        correlationId: job.data.correlationId,
        tenantId: job.data.tenantId,
    });

    try {
        // Execute the analysis
        await IngestService.executeAnalysis(job.docId, job.data);

        // Mark as completed
        ingestionQueue.complete(job.docId);

        await logEvento({
            level: 'INFO',
            source: 'SIMPLE_WORKER',
            action: 'JOB_COMPLETED',
            message: `Job completed successfully: ${job.docId}`,
            correlationId: job.data.correlationId,
            tenantId: job.data.tenantId,
        });
    } catch (error: any) {
        // Mark as failed
        ingestionQueue.fail(job.docId, error.message);

        await logEvento({
            level: 'ERROR',
            source: 'SIMPLE_WORKER',
            action: 'JOB_FAILED',
            message: `Job failed: ${job.docId} - ${error.message}`,
            correlationId: job.data.correlationId,
            tenantId: job.data.tenantId,
            stack: error.stack,
        });
    } finally {
        isProcessing = false;
    }
}

/**
 * Start the worker processor
 * Only runs on server-side (not in browser)
 */
export function startSimpleWorker() {
    // Only run on server
    if (typeof window !== 'undefined') {
        return;
    }

    // Prevent multiple intervals
    if (processorInterval) {
        return;
    }

    console.log('🚀 [SIMPLE_WORKER] Starting ingestion processor (interval: 5s)');

    // Process jobs every 5 seconds
    processorInterval = setInterval(async () => {
        try {
            await processNextJob();
        } catch (error) {
            console.error('[SIMPLE_WORKER] Error in processor:', error);
        }
    }, 5000);

    // Also process immediately on startup
    processNextJob().catch(console.error);
}

/**
 * Stop the worker processor
 */
export function stopSimpleWorker() {
    if (processorInterval) {
        clearInterval(processorInterval);
        processorInterval = null;
        console.log('🛑 [SIMPLE_WORKER] Stopped ingestion processor');
    }
}

// Auto-start in server environment
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
    startSimpleWorker();
}
