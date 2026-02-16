import { logEvento } from '@/lib/logger';
import crypto from 'crypto';
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';

/**
 * Dead Letter Queue - Stores failed jobs after max retries
 * Phase 3: Error Recovery & Resilience
 */

export interface DeadLetterJob {
    tenantId: string;
    docId: string;
    correlationId: string;
    jobType: 'PDF_ANALYSIS' | 'EMBEDDING_GENERATION' | 'MODEL_EXTRACTION';
    failureReason: string;
    retryCount: number;
    lastAttempt: Date;
    stackTrace?: string;
    jobData?: Record<string, any>; // Original job parameters
    auditHash: string; // SHA-256 for immutability
    createdAt: Date;
    resolved?: boolean; // Manual resolution flag
    resolvedAt?: Date;
    resolvedBy?: string;
}

export class DeadLetterQueue {
    /**
     * Add a failed job to the Dead Letter Queue
     */
    static async addToQueue(
        job: Omit<DeadLetterJob, 'auditHash' | 'createdAt'>,
        session?: any
    ): Promise<void> {
        const auditHash = this.hashJob(job);
        const deadLetterJob: DeadLetterJob = {
            ...job,
            auditHash,
            createdAt: new Date(),
            resolved: false
        };

        try {
            const collection = await getTenantCollection('dead_letter_queue', session);

            await collection.insertOne(deadLetterJob);

            await logEvento({
                level: 'ERROR',
                source: 'DEAD_LETTER_QUEUE',
                action: 'JOB_ADDED',
                message: `Job ${job.jobType} failed permanently for doc ${job.docId}`,
                correlationId: job.correlationId,
                tenantId: job.tenantId,
                details: {
                    jobType: job.jobType,
                    retryCount: job.retryCount,
                    failureReason: job.failureReason,
                    auditHash
                }
            });
        } catch (error: any) {
            console.error('[DEAD LETTER QUEUE ERROR]', error);
            // Fallback: log to console if DB insertion fails
            console.error('[DEAD LETTER JOB]', JSON.stringify(deadLetterJob, null, 2));
        }
    }

    /**
     * Get failed jobs for a tenant (for admin dashboard)
     */
    static async getFailedJobs(
        tenantId: string,
        options: {
            limit?: number;
            skip?: number;
            unresolvedOnly?: boolean;
        } = {},
        session?: any
    ): Promise<DeadLetterJob[]> {
        const { limit = 50, skip = 0, unresolvedOnly = true } = options;

        const collection = await getTenantCollection('dead_letter_queue', session);

        const filter: any = { tenantId };
        if (unresolvedOnly) {
            filter.resolved = { $ne: true };
        }

        // SecureCollection.find() returns Promise<Document[]>, use FindOptions for sort/skip/limit
        return await collection.find(filter, {
            sort: { createdAt: -1 } as any,
            skip,
            limit
        }) as any as DeadLetterJob[];
    }

    /**
     * Manual retry of a failed job from admin panel
     */
    static async retryJob(
        jobId: string,
        tenantId: string,
        retryBy: string,
        session?: any
    ): Promise<{ success: boolean; message: string }> {
        const collection = await getTenantCollection('dead_letter_queue', session);

        const job = await collection.findOne({
            _id: new ObjectId(jobId),
            tenantId
        }) as any as DeadLetterJob | null;

        if (!job) {
            return { success: false, message: 'Job not found in Dead Letter Queue' };
        }

        if (job.resolved) {
            return { success: false, message: 'Job already resolved' };
        }

        // Mark as resolved
        await collection.updateOne(
            { _id: new ObjectId(jobId) },
            {
                $set: {
                    resolved: true,
                    resolvedAt: new Date(),
                    resolvedBy: retryBy
                }
            }
        );

        await logEvento({
            level: 'INFO',
            source: 'DEAD_LETTER_QUEUE',
            action: 'JOB_RETRIED',
            message: `Job ${job.jobType} retried manually by ${retryBy}`,
            correlationId: job.correlationId,
            tenantId,
            details: { jobId, docId: job.docId }
        });

        return { success: true, message: 'Job marked for retry. Process it via re-ingestion.' };
    }

    /**
     * Get statistics for monitoring
     */
    static async getStats(tenantId: string, session?: any): Promise<{
        total: number;
        byJobType: Record<string, number>;
        unresolved: number;
    }> {
        const collection = await getTenantCollection('dead_letter_queue', session);

        const jobs = await collection.find({ tenantId }) as any as DeadLetterJob[];

        const stats = {
            total: jobs.length,
            byJobType: {} as Record<string, number>,
            unresolved: jobs.filter(j => !j.resolved).length
        };

        jobs.forEach(job => {
            stats.byJobType[job.jobType] = (stats.byJobType[job.jobType] || 0) + 1;
        });

        return stats;
    }

    /**
     * SHA-256 hash for banking-grade immutability
     */
    private static hashJob(job: Omit<DeadLetterJob, 'auditHash' | 'createdAt'>): string {
        const data = `${job.tenantId}|${job.docId}|${job.correlationId}|${job.failureReason}|${Date.now()}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}
