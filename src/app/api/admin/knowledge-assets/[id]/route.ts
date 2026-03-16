import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { handleApiError, AppError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { knowledgeAssetRepository } from '@/lib/repositories/KnowledgeAssetRepository';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * DELETE /api/admin/knowledge-assets/[id]
 * Proposito: Baja lógica (Soft Delete) de un activo y sus chunks relacionados.
 * REGLA #7: Atomicidad vía MongoDB Transaction.
 */
async function DELETE_internal(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_KNOWLEDGE_ASSETS', action: 'DELETE_ASSET' },
        async ({ log, correlationId }) => {
            const id = (await params).id;

            try {
                const sessionAuth = await requirePermission('knowledge', 'delete');

                if (!id) throw new AppError('VALIDATION_ERROR', 400, 'Asset ID is required');

                const db = await connectDB();
                const mongoSession = db.client.startSession();
                const now = new Date();

                try {
                    await mongoSession.withTransaction(async () => {
                        // 1. Get Asset
                        const asset = await knowledgeAssetRepository.getEntity(id, sessionAuth as any, mongoSession);

                        // 2. Soft delete asset
                        await knowledgeAssetRepository.update(id, {
                            status: 'ARCHIVED',
                            ingestionStatus: 'FAILED', // Stop any processing
                            updatedAt: now,
                            deletedAt: now as any
                        }, sessionAuth as any, mongoSession);

                        // 3. Soft delete chunks
                        const publicId = asset.source.storageKey;
                        const filename = asset.source.filename;

                        const chunkFilter = publicId
                            ? { cloudinary_public_id: publicId }
                            : { origen_doc: filename };

                        await db.collection('document_chunks').updateMany(
                            { ...chunkFilter, tenantId: asset.tenantId },
                            { $set: { status: 'ARCHIVED', deletedAt: now } },
                            { session: mongoSession }
                        );

                        await log({
                            message: `Asset ${id} marked as ARCHIVED`,
                            details: { assetId: id, filename, tenantId: asset.tenantId }
                        });
                    });

                    return NextResponse.json({ success: true, message: 'Asset marked as ARCHIVED' });

                } finally {
                    await mongoSession.endSession();
                }

            } catch (error) {
                return handleApiError(error, 'API_KNOWLEDGE_DELETE', correlationId);
            }
        }
    );
}

export const DELETE = withPerformanceSLA(DELETE_internal, { endpoint: 'API_KNOWLEDGE_DELETE', thresholdMs: 1000 });
