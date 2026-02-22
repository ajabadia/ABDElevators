
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AppError } from '@/lib/errors';
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

    } catch (error: any) {
        console.error(`[API_INGEST] Error:`, error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: 'VALIDATION_ERROR', details: error.issues },
                { status: 400 }
            );
        }

        if (error instanceof AppError || error?.name === 'AppError') {
            const appError = error instanceof AppError ? error : new AppError(error.code, error.status, error.message, error.details);
            return NextResponse.json(appError.toJSON(), { status: appError.status });
        }

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Critical ingest error',
                    details: error.message
                }
            },
            { status: 500 }
        );
    }
}
