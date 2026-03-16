import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { queueService, JobType } from '@/services/ops/queue-service';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/operations/queues
 */
async function GET_internal () {
    return withCorrelation(
        { level: 'INFO', source: 'API_QUEUES', action: 'FETCH_METRICS' },
        async ({ log, correlationId }) => {
            const start = Date.now();
            try {
                const session = await requirePermission('technical:ops', 'read');
                const jobTypes: JobType[] = [
                    'PDF_ANALYSIS',
                    'REPORT_GENERATION',
                    'EMAIL_BATCH',
                    'MAINTENANCE_CLEANUP'
                ];

                const queueData = await Promise.all(jobTypes.map(async (type) => {
                    const recentJobs = await queueService.listJobs(type, ['active', 'failed', 'completed'], 0, 5);
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
                await log({
                    message: `Métricas de colas recuperadas en ${duration}ms`,
                    details: { duration, queueCount: queueData.length },
                    tenantId: session.user.tenantId
                });

                return NextResponse.json({
                    success: true,
                    queues: queueData,
                    timestamp: new Date().toISOString(),
                    correlationId
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_QUEUES_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/operations/queues', thresholdMs: 1000 });
