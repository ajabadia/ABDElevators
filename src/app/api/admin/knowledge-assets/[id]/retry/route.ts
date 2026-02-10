import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import { AppError, NotFoundError } from '@/lib/errors';
import { IngestService } from '@/services/ingest-service';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

/**
 * POST /api/admin/knowledge-assets/[id]/retry
 * Resets a failed asset to PENDING and triggers execution.
 * SLA: P95 < 500ms (to respond, processing is async)
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await auth();
        // Permission check: SUPER_ADMIN or ADMIN/ENGINEERING for their tenant
        const userRole = session?.user?.role;
        if (!['ADMIN', 'SUPER_ADMIN', 'ENGINEERING'].includes(userRole || '')) {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const { id } = await params;
        const tenantId = (session?.user as any).tenantId;
        const db = await connectDB();

        // 1. Find the asset
        const filter = userRole === 'SUPER_ADMIN' ? { _id: new ObjectId(id) } : { _id: new ObjectId(id), tenantId };
        const asset = await db.collection('knowledge_assets').findOne(filter);

        if (!asset) {
            throw new NotFoundError('Knowledge asset not found');
        }

        if (asset.ingestionStatus !== 'FAILED' && asset.ingestionStatus !== 'PENDING') {
            throw new AppError('VALIDATION_ERROR', 400, `Cannot retry asset in state: ${asset.ingestionStatus}`);
        }

        // 2. Reset Status to PENDING
        await db.collection('knowledge_assets').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    ingestionStatus: 'PENDING',
                    progress: 0,
                    error: null,
                    updatedAt: new Date()
                }
            }
        );

        // 3. Log Retry Action
        await logEvento({
            level: 'INFO',
            source: 'API_ASSET_RETRY',
            action: 'INGEST_RETRY_INITIATED',
            message: `Retry requested for asset: ${asset.filename}`,
            correlationId,
            details: { assetId: id, filename: asset.filename }
        });

        // 4. Trigger Analysis (Fire and Forget or via Worker)
        // Note: Using IngestService.executeAnalysis directly as an async promise
        // provides an immediate fallback if BullMQ is not being used.
        IngestService.executeAnalysis(id, {
            correlationId,
            userEmail: session?.user?.email || 'system'
        }).catch(err => {
            console.error(`[RETRY BACKGROUND ERROR] ${id}:`, err);
        });

        return NextResponse.json({
            success: true,
            message: 'Retry initiated. Processing document in background.',
            assetId: id
        });

    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        await logEvento({
            level: 'ERROR',
            source: 'API_ASSET_RETRY',
            action: 'ERROR_FATAL',
            message: error.message,
            correlationId,
            stack: error.stack
        });
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Failed to initiate retry').toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - start;
        if (duration > 500) {
            await logEvento({
                level: 'WARN',
                source: 'API_ASSET_RETRY',
                action: 'SLA_VIOLATION',
                message: `Retry API slow: ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}
