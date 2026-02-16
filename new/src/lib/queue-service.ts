import { Queue, Job } from 'bullmq';
import { getRedisConnection } from './redis';
import { logEvento } from './logger';
import crypto from 'crypto';

/**
 * Definición de tipos de trabajos asíncronos permitidos en la plataforma.
 */
export type JobType =
    | 'PDF_ANALYSIS'
    | 'REPORT_GENERATION'
    | 'EMAIL_BATCH'
    | 'MAINTENANCE_CLEANUP';

export interface JobPayload {
    tenantId: string;
    userId: string;
    correlationId?: string;
    data: any;
}

/**
 * Servicio Centralizado para la gestión de Colas de Trabajo (Fase 31: Async Jobs).
 */
export class QueueService {
    private static instance: QueueService;
    private queues: Map<string, Queue> = new Map();

    private constructor() { }

    public static getInstance(): QueueService {
        if (!QueueService.instance) {
            QueueService.instance = new QueueService();
        }
        return QueueService.instance;
    }

    /**
     * Obtiene o crea una cola específica para un tipo de trabajo.
     */
    private getQueue(type: JobType): Queue {
        if (!this.queues.has(type)) {
            const connection = getRedisConnection();
            this.queues.set(type, new Queue(type, { connection }));
        }
        return this.queues.get(type)!;
    }

    /**
     * Añade un nuevo trabajo a la cola correspondiente.
     */
    public async addJob(type: JobType, payload: JobPayload, options: { priority?: number; delay?: number } = {}): Promise<Job> {
        const queue = this.getQueue(type);
        const jobId = `job_${type}_${crypto.randomUUID()}`;

        const job = await queue.add(jobId, payload, {
            priority: options.priority || 0,
            delay: options.delay || 0,
            removeOnComplete: { count: 180 }, // Mantener historial de 180 completados
            removeOnFail: { count: 180 },     // Mantener historial de 180 fallidos
            attempts: 3,                      // Reintento automático (Regla #RetryLogic)
            backoff: {
                type: 'exponential',
                delay: 1000,
            }
        });

        await logEvento({
            level: 'DEBUG',
            source: 'QUEUE_SERVICE',
            action: 'JOB_ADDED',
            message: `Trabajo ${type} encolado con ID ${job.id}`,
            correlationId: jobId,
            tenantId: payload.tenantId,
            userId: payload.userId,
            details: { jobId: job.id, type }
        });

        return job;
    }

    /**
     * Obtiene el estado de un trabajo.
     */
    public async getJobStatus(type: JobType, jobId: string) {
        const queue = this.getQueue(type);
        const job = await queue.getJob(jobId);

        if (!job) return null;

        return {
            id: job.id,
            state: await job.getState(),
            progress: job.progress,
            result: job.returnvalue,
            failedReason: job.failedReason
        };
    }

    /**
     * Lista trabajos con filtros básicos (Phase 97: Admin Panel).
     */
    public async listJobs(type: JobType, status: ('active' | 'completed' | 'failed' | 'delayed')[], start: number = 0, end: number = 10) {
        const queue = this.getQueue(type);
        const jobs = await queue.getJobs(status, start, end, true); // true = asc
        return jobs.map(j => ({
            id: j.id,
            state: j.finishedOn ? 'completed' : (j.processedOn ? 'active' : 'waiting'), // Simplified
            data: j.data,
            timestamp: j.timestamp
        }));
    }

    /**
     * Reintenta un trabajo fallido.
     */
    public async retryJob(type: JobType, jobId: string) {
        const queue = this.getQueue(type);
        const job = await queue.getJob(jobId);
        if (job) await job.retry();
    }

    /**
     * Elimina un trabajo.
     */
    public async deleteJob(type: JobType, jobId: string) {
        const queue = this.getQueue(type);
        const job = await queue.getJob(jobId);
        if (job) await job.remove();
    }
}

export const queueService = QueueService.getInstance();
