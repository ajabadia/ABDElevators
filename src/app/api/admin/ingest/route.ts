import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { IngestApiService } from '@/services/ingest/IngestApiService';
import { z } from 'zod';

/**
 * POST /api/admin/ingest
 * Processes a PDF file using the IngestService.
 * SLA: P95 < 20000ms
 * 
 * Refactored Phase 213: Delegates orchestration to IngestApiService.
 */
export async function POST(req: NextRequest) {
    try {
        // Authentication (Rule #9: Security Check)
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
        }

        const result = await IngestApiService.handleIngestRequest(req, session);
        return NextResponse.json(result);

    } catch (error: unknown) {
        const errorStack = error instanceof Error ? error.stack : undefined;
        const errorMessage = error instanceof Error ? error.message : String(error);

        await logEvento({
            level: 'ERROR',
            source: 'API_INGEST',
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
}
