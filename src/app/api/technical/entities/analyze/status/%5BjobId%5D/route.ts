import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { analysisQueue } from '@/lib/queues/analysis-queue';
import { handleApiError } from '@/lib/errors';

/**
 * GET /api/technical/entities/analyze/status/[jobId]
 * Consulta el estado de un trabajo de análisis en BullMQ.
 * Phase 292: Async tracking.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { jobId: string } }
) {
    const correlationId = crypto.randomUUID();

    try {
        await enforcePermission('technical:analysis', 'read');
        const { jobId } = params;

        // 1. Fetch job from queue
        // We use analysisQueue.getJob to get status from Redis
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
        return handleApiError(error, 'TECHNICAL_ANALYSIS_STATUS', correlationId);
    }
}
