import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { queueService, JobType } from '@/lib/queue-service';
import { handleApiError, ValidationError } from '@/lib/errors';
import * as crypto from 'crypto';

/**
 * GET /api/admin/ingest/jobs
 * Lista los trabajos de la cola de ingesta (DLQ monitoring).
 */
export async function GET(req: NextRequest) {
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
export async function POST(req: NextRequest) {
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
