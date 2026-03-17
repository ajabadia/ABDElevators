import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { analysisQueue } from '@/lib/queues/analysis-queue';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';

/**
 * GET /api/technical/entities/analyze/status/[jobId]
 * Queries the status of an analysis job in BullMQ.
 */
async function GET_handler(
    req: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'APICORE_ENTITIES_JOBS', action: 'GETJOBSTATUS' },
        async ({ log, correlationId }) => {
            try {
                await requirePermission('technical:analysis', 'read');
                const { jobId } = await params;

                // 1. Fetch job from queue
                const job = await analysisQueue.getJob(jobId);

                if (!job) {
                    return NextResponse.json({
                        success: false,
                        status: 'not_found',
                        message: 'El trabajo no existe o ya ha sido limpiado de la cola'
                    }, { status: 404 });
                }

                // 2. Map BullMQ status to domain status
                const state = await job.getState();
                const progress = job.progress;
                const result = job.returnvalue;
                const failedReason = job.failedReason;

                await log({
                    message: 'Analysis job status retrieved',
                    details: { jobId, state, progress }
                });

                return NextResponse.json({
                    success: true,
                    jobId,
                    state, // 'waiting', 'active', 'completed', 'failed', 'delayed', 'prioritized'
                    progress,
                    result: state === 'completed' ? result : undefined,
                    error: state === 'failed' ? failedReason : undefined,
                    correlationId
                });

            } catch (error: unknown) {
                return handleApiError(error, 'APICORE_ENTITIES_JOBS', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_handler, { endpoint: 'GET /api/core/entities/[type]/analyze/status/[jobId]', thresholdMs: 500 });
