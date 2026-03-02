import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { enforcePermission } from '@/lib/guardian-guard';
import { AppError } from '@/lib/errors';

/**
 * GET /api/admin/ingest/status/[docId]
 * Devuelve el estado actual de la ingesta para un documento específico.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ docId: string }> }
) {
    try {
        const session = await enforcePermission('ingest:status', 'read');

        const { docId } = await params;
        if (!docId) {
            throw new AppError('VALIDATION_ERROR', 400, 'docId is required');
        }

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
        const err = error instanceof AppError ? error : new AppError('INTERNAL_ERROR', 500, String(error));
        console.error(`[INGEST STATUS ERROR]`, err);
        return NextResponse.json(
            { success: false, message: err.message },
            { status: err.status }
        );
    }
}
