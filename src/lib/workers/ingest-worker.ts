import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../redis';
import { IngestService } from '@/services/ingest-service';
import { logEvento } from '../logger';

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
            // Pasamos el job para que IngestService pueda actualizar el progreso en BullMQ
            const result = await IngestService.executeAnalysis(docId, {
                ...options,
                correlationId,
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
        } catch (error: any) {
            await logEvento({
                level: 'ERROR',
                source: 'INGEST_WORKER',
                action: 'JOB_FAILED',
                message: `Error en trabajo ${job.id}: ${error.message}`,
                correlationId,
                tenantId,
                stack: error.stack
            });
            throw error;
        }
    },
    {
        connection,
        concurrency: 2 // Permitir 2 procesamientos simultáneos (Gemini Rate Limits)
    }
);

IngestWorker.on('completed', (job) => {
    console.log(`[IngestWorker] Job ${job.id} has completed!`);
});

IngestWorker.on('failed', (job, err) => {
    console.log(`[IngestWorker] Job ${job?.id} has failed with ${err.message}`);
});
