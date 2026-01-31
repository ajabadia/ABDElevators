import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { connectDB } from '@/lib/db';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

const StatusUpdateSchema = z.object({
    documentId: z.string(),
    status: z.enum(['borrador', 'vigente', 'obsoleto', 'archivado']),
});

/**
 * PATCH /api/admin/knowledge-assets/status
 * Updates the status of a document and its associated chunks.
 * SLA: P95 < 1000ms
 */
export async function PATCH(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const body = await req.json();
        const { documentId, status } = StatusUpdateSchema.parse(body);

        const db = await connectDB();
        const userRole = session?.user?.role;
        const tenantId = (session?.user as any).tenantId;
        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID not found in session');
        }

        // 1. Verify document existence and ownership
        const filter = userRole === 'SUPER_ADMIN' ? { _id: new ObjectId(documentId) } : { _id: new ObjectId(documentId), tenantId };

        const asset = await db.collection('knowledge_assets').findOne(filter);

        if (!asset) {
            throw new NotFoundError('Document not found or access denied');
        }

        const publicId = asset.cloudinaryPublicId || asset.cloudinary_public_id;
        const filename = asset.filename || asset.nombre_archivo;

        // 2. Rule #7: Atomic. Update master document and chunks using Transaction
        let modifiedChunks = 0;
        const client = (db as any).client;
        const session_db = client.startSession();

        try {
            await session_db.withTransaction(async () => {
                // Update master document
                await db.collection('knowledge_assets').updateOne(
                    { _id: new ObjectId(documentId) },
                    { $set: { status: status, updatedAt: new Date() } },
                    { session: session_db }
                );

                // Update associated chunks
                const chunkFilter: any = publicId
                    ? { cloudinary_public_id: publicId, tenantId: asset.tenantId }
                    : { origen_doc: filename, tenantId: asset.tenantId };

                const resultChunks = await db.collection('document_chunks').updateMany(
                    chunkFilter,
                    { $set: { status: status, updatedAt: new Date() } },
                    { session: session_db }
                );

                modifiedChunks = resultChunks.modifiedCount;
            });
        } finally {
            await session_db.endSession();
        }

        await logEvento({
            level: 'INFO',
            source: 'API_DOC_STATUS',
            action: 'UPDATE_STATUS',
            message: `Document ${filename} updated to ${status}`,
            correlationId,
            details: { documentId, status, updatedChunks: modifiedChunks }
        });

        return NextResponse.json({
            success: true,
            message: `Status updated to ${status}`,
            updatedChunks: modifiedChunks
        });

    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Invalid status update data', error.errors).toJSON(),
                { status: 400 }
            );
        }
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_DOC_STATUS',
            action: 'UPDATE_STATUS_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Failed to update status').toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - start;
        if (duration > 1000) {
            await logEvento({
                level: 'WARN',
                source: 'API_DOC_STATUS',
                action: 'SLA_VIOLATION',
                message: `Status update slow: ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}
