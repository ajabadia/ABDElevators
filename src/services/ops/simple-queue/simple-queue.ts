import { logEvento } from '@/lib/logger';

/**
 * Simple in-memory queue for ingestion jobs
 * Replaces BullMQ for simplicity and reliability
 */

export interface IngestionJob {
    docId: string;
    data: any;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    addedAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
}

class SimpleIngestionQueue {
    private queue: Map<string, IngestionJob> = new Map();

    /**
     * Add a new job to the queue
     */
    add(docId: string, data: any): void {
        this.queue.set(docId, {
            docId,
            data,
            status: 'PENDING',
            addedAt: new Date(),
        });

        logEvento({
            level: 'INFO',
            source: 'SIMPLE_QUEUE',
            action: 'JOB_ADDED',
            message: `Job added to queue: ${docId}`,
            correlationId: data.correlationId,
            tenantId: data.tenantId,
        });
    }

    /**
     * Get the next pending job
     */
    getNext(): IngestionJob | null {
        for (const [id, job] of this.queue) {
            if (job.status === 'PENDING') {
                job.status = 'PROCESSING';
                job.startedAt = new Date();
                return job;
            }
        }
        return null;
    }

    /**
     * Mark a job as completed
     */
    complete(docId: string): void {
        const job = this.queue.get(docId);
        if (job) {
            job.status = 'COMPLETED';
            job.completedAt = new Date();
            // Remove from queue after 1 minute to allow status checks
            setTimeout(() => this.queue.delete(docId), 60000);
        }
    }

    /**
     * Mark a job as failed
     */
    fail(docId: string, error: string): void {
        const job = this.queue.get(docId);
        if (job) {
            job.status = 'FAILED';
            job.error = error;
            job.completedAt = new Date();
            // Remove from queue after 1 minute
            setTimeout(() => this.queue.delete(docId), 60000);
        }
    }

    /**
     * Get job status
     */
    getStatus(docId: string): IngestionJob | null {
        return this.queue.get(docId) || null;
    }

    /**
     * Get queue size
     */
    size(): number {
        return this.queue.size;
    }

    /**
     * Get pending jobs count
     */
    pendingCount(): number {
        return Array.from(this.queue.values()).filter(j => j.status === 'PENDING').length;
    }
}

// Singleton instance
export const ingestionQueue = new SimpleIngestionQueue();
