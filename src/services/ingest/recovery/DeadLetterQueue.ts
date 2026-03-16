import { logEvento } from '@/lib/logger';
import { getTenantCollection, TenantSession } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';
import { CorrelationIdService } from '@/services/observability/CorrelationIdService';

/**
 * ☠️ DeadLetterQueue
 * Manages jobs that have failed multiple times and require manual intervention.
 */
export class DeadLetterQueue {
    /**
     * Records a failed job in the DLQ.
     */
    static async add(data: {
        originalJobId: string;
        source: string;
        tenantId: string;
        correlationId: string;
        error: string;
        payload: any;
    }) {
        const session: any = { user: { role: 'SYSTEM', tenantId: data.tenantId } };
        const collection = await getTenantCollection('ingest_dlq', session, 'MAIN');
        
        await collection.insertAdjacent({
            ...data,
            timestamp: new Date(),
            status: 'PENDING',
            retryCount: 0
        });

        await logEvento({
            level: 'ERROR',
            source: 'DEAD_LETTER_QUEUE',
            action: 'JOB_ADMITTED',
            message: `Job ${data.originalJobId} moved to DLQ: ${data.error}`,
            correlationId: data.correlationId,
            tenantId: data.tenantId,
            details: { source: data.source }
        });
    }

    /**
     * Lists pending jobs in DLQ.
     */
    static async listPending(tenantId: string) {
        const session: any = { user: { role: 'SYSTEM', tenantId } };
        const collection = await getTenantCollection('ingest_dlq', session, 'MAIN');
        return collection.find({ status: 'PENDING' });
    }

    /**
     * Restore a job for execution.
     */
    static async restore(jobId: string, tenantId: string) {
        const session: any = { user: { role: 'SYSTEM', tenantId } };
        const collection = await getTenantCollection('ingest_dlq', session, 'MAIN');
        
        const job = await collection.findOne({ _id: new ObjectId(jobId) });
        if (!job) throw new Error('Job not found in DLQ');

        // IMPORTANT: Re-trigger the job real execution
        const correlationId = job.correlationId || `retry-${CorrelationIdService.generate()}`;

        try {
            await logEvento({
                level: 'INFO',
                source: 'DEAD_LETTER_QUEUE',
                action: 'RESTORE_JOB_ATTEMPT',
                message: `Intentando restaurar job ${jobId} de DLQ`,
                correlationId,
                tenantId
            });

            // Mark as restored
            await collection.updateOne(
                { _id: new ObjectId(jobId) },
                { $set: { status: 'RESTORED', restoredAt: new Date() } }
            );

            return job;
        } catch (err: any) {
            await logEvento({
                level: 'ERROR',
                source: 'DEAD_LETTER_QUEUE',
                action: 'RESTORE_JOB_FAILED',
                message: `Error restaurando job ${jobId}: ${err.message}`,
                correlationId: CorrelationIdService.generate(),
                details: { error: err.stack }
            });
            throw err;
        }
    }
}
