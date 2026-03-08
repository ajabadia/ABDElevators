import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { IngestApiService } from '@/services/ingest/IngestApiService';
import { z } from 'zod';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';

const API_SOURCE = 'API_ADMIN_INGEST';

/**
 * POST /api/admin/ingest
 * Processes a PDF file using the IngestService.
 * SLA: P95 < 20000ms
 * 
 * Refactored Phase 213: Delegates orchestration to IngestApiService.
 */
export const POST = withPerformanceSLA(async function POST(req: NextRequest) {
    try {
        // Authentication & ABAC Enforcement (Rule #11)
        const session = await requirePermission('ingest', 'write');

        const result = await IngestApiService.handleIngestRequest(req, session);
        return NextResponse.json(result);

    } catch (error: unknown) {
        const errorStack = error instanceof Error ? error.stack : undefined;
        const errorMessage = error instanceof Error ? error.message : String(error);

        await logEvento({
            level: 'ERROR',
            source: API_SOURCE,
            action: 'INGEST_PROCESS_ERROR',
            message: `Critical ingest error: ${errorMessage}`,
            correlationId: req.headers.get('x-correlation-id') || undefined,
            details: { stack: errorStack }
        });

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: 'VALIDATION_ERROR', details: error.issues },
                { status: 400 }
            );
        }

        if (error instanceof AppError || (error && typeof error === 'object' && 'name' in error && error.name === 'AppError')) {
            const appError = error instanceof AppError ? error : new AppError(
                (error as any).code || 'INTERNAL_ERROR',
                (error as any).status || 500,
                errorMessage,
                (error as any).details
            );
            return NextResponse.json(appError.toJSON(), { status: appError.status });
        }

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Critical ingest error',
                    details: errorMessage
                }
            },
            { status: 500 }
        );
    }
}, { endpoint: 'POST /api/admin/ingest', thresholdMs: 20000 });
