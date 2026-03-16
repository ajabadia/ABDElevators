import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requirePermission } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { EntityIdSchema } from '@/lib/schemas';
import { z } from 'zod';

/**
 * GET /api/admin/ingest/status/[docId]
 * Devuelve el estado actual de la ingesta para un documento específico.
 */
async function GET_internal (
    req: NextRequest,
    { params }: { params: Promise<{ docId: string }> }
) {
    try {
        const session = await requirePermission('ingest:status', 'read');

        const resolvedParams = await params;
        
        // 🛡️ [ERA 8] Zod Validation BEFORE Processing
        const { docId } = z.object({
            docId: EntityIdSchema
        }).parse(resolvedParams);

        const { getTenantCollection } = await import('@/lib/db-tenant');
        const collection = await getTenantCollection('knowledge_assets', session);
        const asset = await collection.findOne({
            _id: new ObjectId(docId)
        });

        if (!asset) {
            throw new AppError('NOT_FOUND', 404, 'Knowledge asset not found');
        }

        return NextResponse.json({
            success: true,
            status: asset.ingestionStatus,
            progress: asset.progress || 0,
            attempts: asset.attempts || 0,
            error: asset.error,
            filename: asset.filename,
            updatedAt: asset.updatedAt
        });

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, message: 'Invalid ID format', details: error.issues },
                { status: 400 }
            );
        }
        const err = error instanceof AppError ? error : new AppError('INTERNAL_ERROR', 500, String(error));
        console.error(`[INGEST STATUS ERROR]`, err);
        return NextResponse.json(
            { success: false, message: err.message },
            { status: err.status }
        );
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/ingest/status/[docId]', thresholdMs: 10000 });
