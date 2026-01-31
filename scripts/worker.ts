import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../src/lib/redis';
import { logEvento } from '../src/lib/logger';
import { JobType, JobPayload } from '../src/lib/queue-service';

/**
 * Worker principal de ABDElevators para procesamiento asíncrono.
 * Este script debe ejecutarse en un proceso independiente (Process Manager/Container).
 */
async function startWorker() {
    console.log('👷 Iniciando Worker de Procesos Asíncronos...');

    const connection = getRedisConnection();

    // 1. Worker para Análisis de PDF
    const analysisWorker = new Worker<JobPayload>(
        'PDF_ANALYSIS',
        async (job: Job<JobPayload>) => {
            await processPdfJob(job);
        },
        { connection, concurrency: 2 }
    );

    // 2. Worker para Generación de Informes
    const reportWorker = new Worker<JobPayload>(
        'REPORT_GENERATION',
        async (job: Job<JobPayload>) => {
            await processReportJob(job);
        },
        { connection, concurrency: 5 }
    );

    // Eventos Globales de los Workers
    analysisWorker.on('completed', (job) => {
        console.log(`✅ Job ${job.id} completado con éxito.`);
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
            });
        }
    });

    console.log('🚀 Workers registrados y escuchando colas.');
}

// Simuladores de procesos pesados
async function processPdfJob(job: Job<JobPayload>) {
    const { tenantId, data } = job.data;
    console.log(`Analyzing PDF for Tenant ${tenantId}: ${data.filename}`);

    // Simulación de procesamiento pesado (IA + Parsing)
    let progress = 0;
    for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 1000));
        progress += 20;
        await job.updateProgress(progress);
    }

    return { success: true, analysisId: 'ANL-' + Date.now() };
}

async function processReportJob(job: Job<JobPayload>) {
    const { tenantId, data } = job.data;
    console.log(`Generating Report for Tenant ${tenantId}: ${data.reportType}`);

    // Simulación de generación de PDF masivo
    await new Promise(r => setTimeout(r, 3000));

    return { success: true, reportUrl: `https://storage.abd.com/reports/${tenantId}/report.pdf` };
}

// Iniciar
startWorker().catch(err => {
    console.error('CRITICAL: Worker failed to start', err);
    process.exit(1);
});
