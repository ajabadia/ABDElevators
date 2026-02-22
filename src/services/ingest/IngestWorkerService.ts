import { Queue } from 'bullmq';
import { getRedisConnection } from '@/lib/redis';
import { logEvento } from '@/lib/logger';

/**
 * IngestWorkerService: Gestión de colas de procesamiento asíncrono.
 * Fase 71: Escalabilidad & Resiliencia Operativa.
 */

const QUEUE_NAME = 'ingest-queue';

let ingestQueue: Queue | null = null;

export class IngestWorkerService {
    /**
     * Obtiene o inicializa la cola de BullMQ.
     */
    static getQueue(): Queue {
        if (!ingestQueue) {
            const connection = getRedisConnection();
            ingestQueue = new Queue(QUEUE_NAME, {
                connection,
                defaultJobOptions: {
                    attempts: 5, // Reintentos automáticos en caso de fallo
                    backoff: {
                        type: 'exponential',
                        delay: 5000, // Comenzar reintento a los 5 seg
                    },
                    removeOnComplete: true, // Limpiar jobs exitosos
                    removeOnFail: false,   // Mantener fallidos para inspección
                }
            });

            logEvento({
                level: 'INFO',
                source: 'QUEUE_SERVICE',
                action: 'INITIALIZATION',
                message: `Cola BullMQ "${QUEUE_NAME}" inicializada`,
                correlationId: 'SYSTEM'
            }).catch(console.error);
        }
        return ingestQueue;
    }

    /**
     * Encola un nuevo documento para análisis profundo.
     */
    static async enqueueIngest(docId: string, options: {
        tenantId: string;
        userEmail: string;
        correlationId: string;
        maskPii: boolean;
        environment: string;
    }) {
        const queue = this.getQueue();

        const job = await queue.add('analyze-document', {
            docId,
            ...options
        }, {
            jobId: `ingest:${docId}:${options.environment}`, // Evitar duplicados en cola para el mismo docId/env
        });

        await logEvento({
            level: 'INFO',
            source: 'QUEUE_SERVICE',
            action: 'JOB_ENQUEUED',
            message: `Job ${job.id} encolado para documento ${docId}`,
            correlationId: options.correlationId,
            tenantId: options.tenantId,
            details: { jobId: job.id, docId }
        });

        return job;
    }
}
