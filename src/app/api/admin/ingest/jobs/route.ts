import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { queueService } from '@/services/ops/queue-service';
import { handleApiError, ValidationError } from '@/lib/errors';

/**
 * GET /api/admin/ingest/jobs
 * Lista los trabajos de la cola de ingesta (DLQ monitoring).
 */
async function GET_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        await enforcePermission('ingest:jobs', 'read');

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'failed';
        const page = parseInt(searchParams.get('page') || '0');
        const limit = parseInt(searchParams.get('limit') || '20');

        const start = page * limit;
        const end = start + limit - 1;

        // Por ahora solo monitoreamos la cola de PDF_ANALYSIS que es la principal de ingesta
        const jobs = await queueService.listJobs('PDF_ANALYSIS', [status as any], start, end);

        return NextResponse.json({
            success: true,
            jobs,
            pagination: { page, limit }
        });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_INGEST_JOBS_GET', correlationId);
    }
}

/**
 * POST /api/admin/ingest/jobs
 * Acciones sobre los trabajos (retry, delete).
 */
async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        await enforcePermission('ingest:jobs', 'update');

        const body = await req.json();
        const { jobId, action } = body;

        if (!jobId || !action) {
            throw new ValidationError('jobId and action are required');
        }

        let result;
        if (action === 'RETRY') {
            result = await queueService.retryJob('PDF_ANALYSIS', jobId);
        } else if (action === 'DELETE') {
            result = await queueService.deleteJob('PDF_ANALYSIS', jobId);
        } else {
            throw new ValidationError('Invalid action. Use RETRY or DELETE');
        }

        return NextResponse.json({
            success: true,
            result
        });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_INGEST_JOBS_POST', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/ingest/jobs', thresholdMs: 10000 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/ingest/jobs', thresholdMs: 10000 });
