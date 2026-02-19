import { NextResponse } from 'next/server';
import { queueService, JobType } from '@/lib/queue-service';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { generateUUID } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/operations/queues
 * Retorna el estado y métricas de todas las colas BullMQ del sistema.
 */
export async function GET() {
    const correlationId = generateUUID();
    const start = Date.now();

    try {
        const jobTypes: JobType[] = [
            'PDF_ANALYSIS',
            'REPORT_GENERATION',
            'EMAIL_BATCH',
            'MAINTENANCE_CLEANUP'
        ];

        const queueData = await Promise.all(jobTypes.map(async (type) => {
            // En una implementación real de BullMQ, podrías llamar a queue.getJobCounts()
            // Para mantener nuestro QueueService limpio, usaremos listJobs para ver actividad reciente
            const recentJobs = await queueService.listJobs(type, ['active', 'failed', 'completed'], 0, 5);

            // Simulación de conteos si el QueueService no expone getJobCounts directamente
            // (En un entorno de producción añadiríamos getJobCounts al QueueService)
            return {
                type,
                recentJobs,
                metrics: {
                    active: recentJobs.filter(j => j.state === 'active').length,
                    failed: recentJobs.filter(j => j.state === 'failed').length,
                    completed: recentJobs.filter(j => j.state === 'completed').length,
                }
            };
        }));

        const duration = Date.now() - start;
        await logEvento({
            level: 'INFO',
            source: 'API_QUEUES',
            action: 'FETCH_METRICS',
            message: `Métricas de colas recuperadas en ${duration}ms`,
            correlationId,
            details: { duration, queueCount: queueData.length }
        });

        return NextResponse.json({
            success: true,
            queues: queueData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Queue API Error:', error);

        await logEvento({
            level: 'ERROR',
            source: 'API_QUEUES',
            action: 'FETCH_METRICS_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            correlationId,
            details: { stack: error instanceof Error ? error.stack : undefined }
        });

        if (error instanceof AppError) {
            return NextResponse.json(
                { success: false, code: error.code, message: error.message },
                { status: error.status }
            );
        }

        return NextResponse.json(
            { success: false, code: 'INTERNAL_ERROR', message: 'Failed to fetch queue metrics' },
            { status: 500 }
        );
    }
}
