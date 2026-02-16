import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import { AppError, NotFoundError } from '@/lib/errors';
import { deletePDFFromCloudinary } from '@/lib/cloudinary';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

/**
 * DELETE /api/admin/knowledge-assets/[id]
 * Physically deletes a document from DB and Cloudinary.
 * Also deletes all associated chunks.
 * SLA: P95 < 2000ms
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const { id } = await params;
        const db = await connectDB();
        const userRole = session?.user?.role;
        const tenantId = (session?.user as any).tenantId;
        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID not found in session');
        }

        // 1. Find document and verify ownership (except for SuperAdmin)
        const filter = userRole === 'SUPER_ADMIN' ? { _id: new ObjectId(id) } : { _id: new ObjectId(id), tenantId };

        const asset = await db.collection('knowledge_assets').findOne(filter);

        if (!asset) {
            throw new NotFoundError('Document not found');
        }

        const publicId = asset.cloudinaryPublicId || asset.cloudinary_public_id; // Support both new and legacy

        // 2. Atomic Operation (Simulated via try/catch as Atlas generic tier might not support multi-doc transactions)
        // In production use session.withTransaction() if available

        // 2. Soft Delete Operation (Compliance: Audit & Recovery)
        // We do NOT delete from Cloudinary to allow recovery.

        const now = new Date();

        // 2.1 Update associated chunks to 'obsoleto'
        const filename = asset.filename || asset.nombre_archivo;
        const chunkFilter: any = publicId
            ? { cloudinary_public_id: publicId, tenantId: asset.tenantId }
            : { origen_doc: filename, tenantId: asset.tenantId }; // Legacy fallback

        const chunkUpdateResult = await db.collection('document_chunks').updateMany(
            chunkFilter,
            {
                $set: {
                    status: 'obsoleto',
                    deletedAt: now
                }
            }
        );

        // 2.2 Update master document to 'obsoleto'
        const assetUpdateResult = await db.collection('knowledge_assets').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status: 'obsoleto',
                    deletedAt: now,
                    updatedAt: now
                }
            }
        );

        await logEvento({
            level: 'INFO',
            source: 'API_ASSET_DELETE',
            action: 'SOFT_DELETE_SUCCESS',
            message: `Document ${filename} soft-deleted successfully`,
            correlationId,
            details: {
                assetId: id,
                chunksAffected: chunkUpdateResult.modifiedCount,
                assetAffected: assetUpdateResult.modifiedCount
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Document and fragments soft-deleted successfully',
            details: {
                chunks: chunkUpdateResult.modifiedCount,
                type: 'soft-delete'
            }
        });

    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_ASSET_DELETE',
            action: 'ERROR_FATAL',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Critical error deleting document').toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - start;
        if (duration > 2000) {
            await logEvento({
                level: 'WARN',
                source: 'API_ASSET_DELETE',
                action: 'SLA_VIOLATION',
                message: `Delete slow: ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}
