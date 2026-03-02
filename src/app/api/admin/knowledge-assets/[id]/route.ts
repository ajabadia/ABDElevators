import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { handleApiError, AppError } from '@/lib/errors';
import { ObjectId } from 'mongodb';
import { logEvento } from '@/lib/logger';
import { enforcePermission } from '@/lib/guardian-guard';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { knowledgeAssetRepository } from '@/lib/repositories/KnowledgeAssetRepository';

/**
 * DELETE /api/admin/knowledge-assets/[id]
 * Proposito: Baja lógica (Soft Delete) de un activo y sus chunks relacionados.
 * REGLA #7: Atomicidad vía MongoDB Transaction.
 */
export const DELETE = withPerformanceSLA(async (
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    const correlationId = crypto.randomUUID();
    const id = (await params).id;

    try {
        const sessionAuth = await enforcePermission('knowledge', 'delete');

        if (!id) throw new AppError('VALIDATION_ERROR', 400, 'Asset ID is required');

        const db = await connectDB();
        const mongoSession = db.client.startSession();
        const now = new Date();

        try {
            await mongoSession.withTransaction(async () => {
                // 1. Get Asset
                const asset = await knowledgeAssetRepository.findById(id, sessionAuth as any, mongoSession);
                if (!asset) throw new AppError('NOT_FOUND', 404, 'Asset not found');

                // 2. Soft delete asset
                await knowledgeAssetRepository.update(id, {
                    $set: {
                        status: 'obsoleto',
                        ingestionStatus: 'FAILED', // Stop any processing
                        updatedAt: now,
                        deletedAt: now as any
                    }
                }, sessionAuth as any, mongoSession);

                // 3. Soft delete chunks
                const publicId = asset.cloudinaryPublicId || (asset as any).cloudinary_public_id;
                const filename = asset.filename;

                const chunkFilter = publicId
                    ? { cloudinary_public_id: publicId }
                    : { origen_doc: filename };

                await db.collection('document_chunks').updateMany(
                    { ...chunkFilter, tenantId: asset.tenantId },
                    { $set: { status: 'obsoleto', deletedAt: now } },
                    { session: mongoSession }
                );

                await logEvento({
                    level: 'INFO',
                    source: 'API_KNOWLEDGE_ASSETS',
                    action: 'DELETE_ASSET',
                    message: `Asset ${id} marked as obsolete`,
                    correlationId,
                    tenantId: asset.tenantId,
                    details: { assetId: id, filename }
                });
            });

            return NextResponse.json({ success: true, message: 'Asset marked as obsolete' });

        } finally {
            await mongoSession.endSession();
        }

    } catch (error) {
        return handleApiError(error, 'API_KNOWLEDGE_DELETE', correlationId);
    }
}, { endpoint: 'API_KNOWLEDGE_DELETE', thresholdMs: 1000 });
