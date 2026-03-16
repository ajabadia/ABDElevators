import { NextRequest, NextResponse } from 'next/server';
import { DataLifecycleService } from '@/services/ops/data-lifecycle-service';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/cron/data-lifecycle
 * Triggered by Vercel Cron to perform weekly data maintenance.
 */
async function cronHandler(request: NextRequest) {
    return await withCorrelation(
        { level: 'INFO', source: 'API_CRON_LIFECYCLE', action: 'LIFECYCLE_JOB' },
        async ({ log, correlationId }) => {
            const authHeader = request.headers.get('authorization');

            if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
                await log({
                    level: 'WARN',
                    action: 'UNAUTHORIZED_ATTEMPT',
                    message: 'Unauthorized cron invocation attempt'
                });
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            try {
                await log({
                    action: 'LIFECYCLE_START',
                    message: 'Iniciando mantenimiento semanal',
                    tenantId: 'platform_master'
                });

                const results = {
                    aggregated: await DataLifecycleService.aggregateMetrics(30),
                    purgedLogs: await DataLifecycleService.purgeOldLogs(90),
                    orphanedBlobs: await DataLifecycleService.cleanOrphanedBlobs(),
                    softDeletes: await DataLifecycleService.processSoftDeletes(30)
                };

                await log({
                    action: 'LIFECYCLE_COMPLETED',
                    message: 'Mantenimiento semanal completado con éxito',
                    details: results
                });

                return NextResponse.json({ success: true, results });
            } catch (error: unknown) {
                return handleApiError(error, 'API_CRON_LIFECYCLE', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(cronHandler, { endpoint: 'CRON_DATA_LIFECYCLE', thresholdMs: 30000, source: 'API_CRON' });
