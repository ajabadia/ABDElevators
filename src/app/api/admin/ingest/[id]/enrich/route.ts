import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { IngestApiService } from '@/services/ingest/IngestApiService';
import { z } from 'zod';

/**
 * POST /api/admin/ingest/[id]/enrich
 * Triggers partial re-processing (enrichment) of an existing document.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Authentication (Rule #9: Security Check)
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
        }

        const id = params.id;
        if (!id) {
            throw new AppError('VALIDATION_ERROR', 400, 'Document ID is required');
        }

        const result = await IngestApiService.handleEnrichRequest(req, id, session);
        return NextResponse.json(result);

    } catch (error: any) {
        console.error(`[API_INGEST_ENRICH] Error:`, error);

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
                    message: 'Critical enrichment error',
                    details: error.message
                }
            },
            { status: 500 }
        );
    }
}
