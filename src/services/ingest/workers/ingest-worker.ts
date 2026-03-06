import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '@/lib/redis';
import { IngestService } from '@/services/ingest/IngestService';
import { IngestOrchestrator } from '@/services/ingest/core/IngestOrchestrator';
import { logEvento } from '@/lib/logger';

/**
 * Worker para el procesamiento asíncrono de documentos (Phase 54).
 * Escucha la cola 'PDF_ANALYSIS' y delega en IngestService.executeAnalysis.
 */
const connection = getRedisConnection();

export const IngestWorker = new Worker(
    'PDF_ANALYSIS',
    async (job: Job) => {
        const { tenantId, correlationId, data } = job.data;
        const { docId, options } = data;

        await logEvento({
            level: 'INFO',
            source: 'INGEST_WORKER',
            action: 'JOB_START',
            message: `Procesando trabajo ${job.id} (Doc: ${docId})`,
            correlationId,
            tenantId
        });

        try {
            // Era 6: Use central orchestrator for state validation & cost persistence
            const result = await IngestOrchestrator.coordinate(docId, correlationId, {
                ...options,
                tenantId,
                job
            });

            await logEvento({
                level: 'INFO',
                source: 'INGEST_WORKER',
                action: 'JOB_COMPLETED',
                message: `Trabajo ${job.id} completado con éxito.`,
                correlationId,
                tenantId,
                details: { result }
            });

            return result;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            const stack = error instanceof Error ? error.stack : undefined;
            await logEvento({
                level: 'ERROR',
                source: 'INGEST_WORKER',
                action: 'JOB_FAILED',
                message: `Error en trabajo ${job.id}: ${message}`,
                correlationId,
                tenantId,
                stack
            });
            throw error;
        }
    },
    {
        connection,
        concurrency: 2 // Permitir 2 procesamientos simultáneos (Gemini Rate Limits)
    }
);

IngestWorker.on('completed', async (job) => {
    await logEvento({
        level: 'INFO',
        source: 'INGEST_WORKER',
        action: 'EVENT_COMPLETED',
        message: `Job ${job.id} has completed successfully.`
    });
});

IngestWorker.on('failed', async (job, err) => {
    await logEvento({
        level: 'ERROR',
        source: 'INGEST_WORKER',
        action: 'EVENT_FAILED',
        message: `Job ${job?.id} failed: ${err.message}`,
        details: { jobId: job?.id, error: err.message }
    });
});

IngestWorker.on('error', async (err) => {
    await logEvento({
        level: 'ERROR',
        source: 'INGEST_WORKER',
        action: 'CRITICAL_ERROR',
        message: `Worker critical error: ${err.message}`,
        details: { error: err.message }
    });
});
