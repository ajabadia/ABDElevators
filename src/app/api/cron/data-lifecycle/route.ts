import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { DataLifecycleService } from '@/services/ops/data-lifecycle-service';
import { logEvento } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';

/**
 * GET /api/cron/data-lifecycle
 * Triggered by Vercel Cron to perform weekly data maintenance.
 * Hardened Era 8: Performance SLA and trace tracking.
 */
async function cronHandler(request: Request) {
    const authHeader = request.headers.get('authorization');
    const correlationId = crypto.randomUUID();

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

    } catch (error: unknown) {
        return handleApiError(error, 'API_CRON_LIFECYCLE', correlationId);
    }
}

export const GET = withPerformanceSLA(cronHandler, {
    endpoint: 'CRON_DATA_LIFECYCLE',
    thresholdMs: 30000, // SLA: 30s as it handles large datasets
    source: 'API_CRON'
});
