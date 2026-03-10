import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '@/lib/redis';
import { TechnicalEntityService } from '@/services/core/TechnicalEntityService';
import { logEvento } from '@/lib/logger';
import { technicalEntityRepository } from '@/lib/repositories/TechnicalEntityRepository';
import { ObjectId } from 'mongodb';

/**
 * 🛠️ AnalysisWorker
 * Processes background RAG analysis for technical entities.
 */

const connection = getRedisConnection();

export const AnalysisWorker = new Worker(
    'TECHNICAL_ENTITY_ANALYSIS',
    async (job: Job) => {
        const { entityId, entityText, filename, tenantId, industry, correlationId, fileMd5 } = job.data;

        await logEvento({
            level: 'INFO',
            source: 'ANALYSIS_WORKER',
            action: 'JOB_START',
            message: `Processing analysis job ${job.id} for entity ${entityId}`,
            correlationId,
            tenantId,
            details: { filename, jobId: job.id }
        });

        try {
            // 1. Perform the full RAG analysis
            const results = await TechnicalEntityService.performFullAnalysis(
                entityText,
                filename,
                tenantId,
                industry,
                correlationId,
                fileMd5
            );

            // 2. Persist results in the entity document
            // Standard Era 8: Use $set for atomic updates through Repository
            // Pass session object for multi-tenant isolation
            const session = { user: { tenantId, id: 'system', role: 'SYSTEM' } } as any;

            await technicalEntityRepository.update(
                new ObjectId(entityId),
                {
                    $set: {
                        status: 'analyzed',
                        detectedPatterns: results.patternsForStorage,
                        "metadata.risks": results.detectedRisks,
                        "metadata.insights": results.federatedInsights,
                        updatedAt: new Date(),
                        jobId: job.id
                    }
                },
                session
            );

            await logEvento({
                level: 'INFO',
                source: 'ANALYSIS_WORKER',
                action: 'JOB_COMPLETED',
                message: `Analysis job ${job.id} completed successfully for entity ${entityId}`,
                correlationId,
                tenantId,
                details: { patternsFound: results.resultsWithContext.length }
            });

            return results;

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            const stack = error instanceof Error ? error.stack : undefined;

            await logEvento({
                level: 'ERROR',
                source: 'ANALYSIS_WORKER',
                action: 'JOB_FAILED',
                message: `Analysis job ${job.id} failed: ${message}`,
                correlationId,
                tenantId,
                details: { error: message },
                stack
            });

            // Update status to error so UI can reflect it
            const session = { user: { tenantId, id: 'system', role: 'SYSTEM' } } as any;
            await technicalEntityRepository.update(
                new ObjectId(entityId),
                {
                    $set: {
                        status: 'error',
                        error_message: message,
                        updatedAt: new Date(),
                        lastErrorId: correlationId
                    }
                },
                session
            );

            throw error;
        }
    },
    {
        connection: connection as any,
        concurrency: 2, // Gemini rate limits
    }
);

// Worker Events for Audit
AnalysisWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
});

AnalysisWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with ${err.message}`);
});
