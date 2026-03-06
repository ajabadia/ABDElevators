import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { IngestService } from '@/services/ingest/IngestService';
import { logEvento } from '@/lib/logger';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * Standalone Worker para desarrollo local
 * Usa Redis local en Docker (localhost:6379)
 */

console.log('🚀 [WORKER] Iniciando worker de ingesta...');

const connection = new IORedis('redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

connection.on('connect', () => {
    console.log('✅ [WORKER] Conectado a Redis local (localhost:6379)');
});

connection.on('error', (err) => {
    console.error('❌ [WORKER] Error de conexión a Redis:', err.message);
});

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
        } catch (error: unknown) {
            const err = error as Error;
            await logEvento({
                level: 'ERROR',
                source: 'INGEST_WORKER',
                action: 'INGEST_JOB_FAILED',
                message: `Escaneo de job ${job.id} falló: ${err.message}`,
                correlationId: correlationId || 'standalone',
                details: { error: err.stack }
            });
            throw error;
        }
    },
    {
        connection,
        concurrency: 2
    }
);

IngestWorker.on('completed', (job) => {
    console.log(`✅ [WORKER] Job ${job.id} completado`);
});

IngestWorker.on('failed', (job, err) => {
    console.log(`❌ [WORKER] Job ${job?.id} falló: ${err.message}`);
});

console.log('👂 [WORKER] Escuchando cola PDF_ANALYSIS...');
