import { Queue } from 'bullmq';
import { getRedisConnection } from '@/lib/redis';
import { IndustryType } from '@/lib/schemas';
import { CorrelationIdService } from '@/services/observability/CorrelationIdService';

/**
 * 🛰️ TECHNICAL_ENTITY_ANALYSIS Queue
 * Handles background RAG analysis for technical entities.
 */

import { type TenantId, type EntityId } from '../schemas/common';

const connection = getRedisConnection() as any;

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
    entityId: EntityId;
    entityText: string;
    filename: string;
    tenantId: TenantId;
    industry: IndustryType;
    correlationId: string;
    fileMd5: string;
}

import { SecurityService } from '@/services/security/security-service';

/**
 * 🛰️ Adds a new analysis job to the queue with encryption
 */
export async function addAnalysisJob(data: AnalysisJobData) {
    const correlationId = data.correlationId || CorrelationIdService.generate();
    
    // 🛡️ [Wave 4] Encrypt sensitive payload for Redis storage
    const encryptedData = await SecurityService.encrypt(JSON.stringify(data));
    
    return await analysisQueue.add('perform-full-analysis', { encryptedPayload: encryptedData }, {
        jobId: `analysis_${data.entityId}_${Date.now()}`,
    });
}
