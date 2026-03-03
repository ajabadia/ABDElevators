import { NextRequest, NextResponse } from 'next/server';
import { DataLifecycleService } from '@/services/ops/data-lifecycle-service';
import { logEvento } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';

/**
 * GET /api/cron/data-lifecycle
 * Triggered by Vercel Cron to perform weekly data maintenance.
 */
async function cronHandler(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const correlationId = crypto.randomUUID();

    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await logEvento({
            level: 'INFO', source: 'API_CRON_LIFECYCLE', action: 'LIFECYCLE_START',
            message: 'Iniciando mantenimiento semanal', correlationId, tenantId: 'platform_master'
        });

        const results = {
            aggregated: await DataLifecycleService.aggregateMetrics(30),
            purgedLogs: await DataLifecycleService.purgeOldLogs(90),
            orphanedBlobs: await DataLifecycleService.cleanOrphanedBlobs(),
            softDeletes: await DataLifecycleService.processSoftDeletes(30)
        };

        return NextResponse.json({ success: true, results });
    } catch (error: unknown) {
        return handleApiError(error, 'API_CRON_LIFECYCLE', correlationId);
    }
}

export const GET = withPerformanceSLA(cronHandler, { endpoint: 'CRON_DATA_LIFECYCLE', thresholdMs: 30000, source: 'API_CRON' });
