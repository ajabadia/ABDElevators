import { Queue } from 'bullmq';
import { getRedisConnection } from '@/lib/redis';
import { IndustryType } from '@/lib/schemas';

/**
 * 🛰️ TECHNICAL_ENTITY_ANALYSIS Queue
 * Handles background RAG analysis for technical entities.
 */

const connection = getRedisConnection();

export const analysisQueue = new Queue('TECHNICAL_ENTITY_ANALYSIS', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

interface AnalysisJobData {
    entityId: string;
    entityText: string;
    filename: string;
    tenantId: string;
    industry: IndustryType;
    correlationId: string;
    fileMd5: string;
}

/**
 * Adds a new analysis job to the queue
 */
export async function addAnalysisJob(data: AnalysisJobData) {
    return await analysisQueue.add('perform-full-analysis', data, {
        jobId: `analysis_${data.entityId}_${Date.now()}`,
    });
}
