import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { IngestApiService } from '@/services/ingest/IngestApiService';
import { z } from 'zod';

/**
 * POST /api/admin/ingest/[id]/enrich
 * Triggers partial re-processing (enrichment) of an existing document.
 */
async function POST_internal(req: NextRequest, paramsContext: { params: { id: string } }) {
    const correlationId = crypto.randomUUID();
    try {
        // Authentication (Rule #9: ABAC)
        const session = await requirePermission('knowledge:asset', 'manage');

        const { id } = paramsContext.params;
        if (!id) {
            throw new AppError('VALIDATION_ERROR', 400, 'Document ID is required');
        }

        const result = await IngestApiService.handleEnrichRequest(req, id, session);
        return NextResponse.json(result);

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: 'VALIDATION_ERROR', details: error.issues },
                { status: 400 }
            );
        }

        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        const message = error instanceof Error ? error.message : 'Critical enrichment error';
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message,
                    correlationId
                }
            },
            { status: 500 }
        );
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/ingest/[id]/enrich', thresholdMs: 10000 });
