import { NextResponse } from 'next/server';
import { DataLifecycleService } from '@/lib/services/data-lifecycle-service';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';

/**
 * GET /api/cron/data-lifecycle
 * Triggered by Vercel Cron to perform weekly data maintenance.
 * Phase 132.5
 */
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    const correlationId = `cron-lifecycle-${Date.now()}`;

    // 1. Security Check (Vercel Cron Secret)
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const start = Date.now();

    try {
        await logEvento({
            level: 'INFO',
            source: 'API_CRON_LIFECYCLE',
            action: 'LIFECYCLE_START',
            message: 'Iniciando mantenimiento semanal de ciclo de vida de datos',
            correlationId,
            tenantId: 'platform_master'
        });

        // 2. Ejecutar tareas secuencialmente para evitar sobrecarga
        const results = {
            aggregated: await DataLifecycleService.aggregateMetrics(30), // Agrupar logs antiguos
            purgedLogs: await DataLifecycleService.purgeOldLogs(90),       // Borrar logs operativos > 90 días
            orphanedBlobs: await DataLifecycleService.cleanOrphanedBlobs(), // Limpiar blobs sin referencia
            softDeletes: await DataLifecycleService.processSoftDeletes(30)  // Hard-delete de borrados antiguos
        };

        const duration = Date.now() - start;

        await logEvento({
            level: 'INFO',
            source: 'API_CRON_LIFECYCLE',
            action: 'LIFECYCLE_COMPLETE',
            message: `Mantenimiento completado en ${duration}ms`,
            correlationId,
            tenantId: 'platform_master',
            details: { ...results, duration_ms: duration }
        });

        return NextResponse.json({
            success: true,
            results,
            duration_ms: duration
        });

    } catch (error: any) {
        const duration = Date.now() - start;
        console.error('[CRON_LIFECYCLE_ERROR]', error);

        await logEvento({
            level: 'ERROR',
            source: 'API_CRON_LIFECYCLE',
            action: 'LIFECYCLE_FAILED',
            message: `Error en mantenimiento de ciclo de vida: ${error.message}`,
            correlationId,
            tenantId: 'platform_master',
            details: { error: error.message, stack: error.stack, duration_ms: duration }
        });

        if (error instanceof AppError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
