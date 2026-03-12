import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { connectDB, connectAuthDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { logEvento } from '@/lib/logger';
import { v2 as cloudinary } from 'cloudinary';
import { AppError, NotFoundError } from '@/lib/errors';

// Configure Cloudinary for deletion
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * DELETE /api/auth/knowledge-assets/[id]
 * Soft-Delete of a knowledge asset (Compliance).
 * SLA: P95 < 1000ms
 */
async function DELETE_internal(
    req: NextRequest,
    paramsContext: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();

    try {
        const session = await requirePermission('knowledge:asset', 'write');

        const { id } = await paramsContext.params;

        // 🛡️ SECURITY: Validate format before ObjectId constructor
        const { ObjectIdSchema } = await import('@/lib/schemas/common');
        ObjectIdSchema.parse(id);
        const tenantId = session.user.tenantId;

        const authDb = await connectAuthDB();
        const user = await authDb.collection('users').findOne({ email: session.user.email });

        if (!user) throw new NotFoundError('User not found');

        const db = await connectDB();

        // 1. Soft Delete in User Documents (Corrected Collection)
        const result = await db.collection('user_documents').findOneAndUpdate(
            {
                _id: new ObjectId(id),
                userId: user._id.toString(), // Security: Only owner
                anchor: tenantId // Simplified for anchor/tenant check
            },
            {
                $set: {
                    status: 'deleted',
                    deletedAt: new Date(),
                    deletedBy: session.user.email
                }
            }
        );

        if (!result) {
            throw new NotFoundError('Document not found or not authorized');
        }

        // NOTE: Soft Delete (Compliance). Cleaning job required for hard delete.

        await logEvento({
            level: 'INFO',
            source: 'API_USER_DOCS',
            action: 'SOFT_DELETE_DOC',
            message: `Document marked as deleted: ${id}`,
            correlationId: correlationId,
            details: { docId: id }
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        const message = error instanceof Error ? error.message : 'Error deleting document';
        await logEvento({
            level: 'ERROR',
            source: 'API_DOCS_USER',
            action: 'DELETE_DOC_ERROR',
            message,
            correlationId: correlationId,
            details: { stack: error instanceof Error ? error.stack : undefined }
        });
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, message).toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - startTime;
        if (duration > 1000) {
            await logEvento({
                level: 'WARN',
                source: 'API_DOCS_USER',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `DELETE /api/auth/knowledge-assets/[id] took ${duration}ms`,
                correlationId: correlationId,
                details: { duration_ms: duration }
            });
        }
    }
}

export const DELETE = withPerformanceSLA(DELETE_internal, { endpoint: 'DELETE /api/auth/knowledge-assets/[id]', thresholdMs: 1000 });
