import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../src/lib/redis';
import { logEvento } from '../src/lib/logger';
import { JobPayload } from '../src/lib/queue-service';
import { AsyncJobsLogic } from '../src/lib/async-jobs-logic';
import { connectDB, connectAuthDB, connectLogsDB } from '../src/lib/db';
import { initTracing } from '../src/lib/tracing';

// 🛡️ FASE 31: Observabilidad Pro
initTracing('abd-async-worker');

/**
 * Worker principal de ABDElevators para procesamiento asíncrono.
 * Este script debe ejecutarse en un proceso independiente (Process Manager/Container).
 */
async function startWorker() {
    console.log('👷 Iniciando Worker de Procesos Asíncronos...');

    // Asegurar conexiones DB antes de empezar
    try {
        await Promise.all([
            connectDB(),
            connectAuthDB(),
            connectLogsDB()
        ]);
        console.log('📂 Conexiones a Bases de Datos establecidas.');
    } catch (dbErr) {
        console.error('❌ Error conectando a BD:', dbErr);
        process.exit(1);
    }

    const connection = getRedisConnection();

    // 1. Worker para Análisis de PDF
    const analysisWorker = new Worker<JobPayload>(
        'PDF_ANALYSIS',
        async (job: Job<JobPayload>) => {
            console.log(`[Worker] Procesando PDF Analysis Job ${job.id}`);
            return await AsyncJobsLogic.processPdfAnalysis(
                job.data,
                job.id!,
                (p) => job.updateProgress(p)
            );
        },
        {
            connection,
            concurrency: 2,
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 500 }
        }
    );

    // Eventos Globales
    analysisWorker.on('completed', (job) => {
        console.log(`✅ Job ${job.id} de tipo ${job.name} completado con éxito.`);
    });

    analysisWorker.on('failed', async (job, err) => {
        const errorMsg = `❌ Job ${job?.id} falló: ${err.message}`;
        console.error(errorMsg);

        if (job) {
            await logEvento({
                level: 'ERROR',
                source: 'ASYNC_WORKER',
                action: 'JOB_FAILED',
                message: errorMsg,
                correlationId: job.id || 'unknown',
                tenantId: job.data.tenantId,
                details: { error: err.message, stack: err.stack }
            }).catch(() => { });
        }
    });

    console.log('🚀 Workers registrados y escuchando colas.');
}

// Iniciar
startWorker().catch(err => {
    console.error('CRITICAL: Worker failed to start', err);
    process.exit(1);
});
