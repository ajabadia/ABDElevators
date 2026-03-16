import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { handleApiError, AppError, ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * ⚡ ERA 12: Standardized Status Schema
 */
const StatusUpdateSchema = z.object({
    documentId: z.string(),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'RESET_PENDING']),
});

/**
 * PATCH /api/admin/knowledge-assets/status
 * Updates the status of a document and its associated chunks.
 * SLA: P95 < 1000ms
 */
async function PATCH_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_DOC_STATUS', action: 'UPDATE_STATUS' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('knowledge:asset', 'manage');

                const body = await req.json();
                const { documentId, status } = StatusUpdateSchema.parse(body);

                const db = await connectDB();
                const userRole = session.user.role;
                const tenantId = session.user.tenantId;

                // 1. Verify document existence and ownership
                const filter = userRole === 'SUPER_ADMIN' ? { _id: new ObjectId(documentId) } : { _id: new ObjectId(documentId), tenantId };

                const asset = await db.collection('knowledge_assets').findOne(filter);

                if (!asset) {
                    throw new NotFoundError('Document not found or access denied');
                }

                const filename = asset.filename || asset.nombre_archivo || asset.source?.filename;

                // 2. Rule #7: Atomic. Update master document and chunks using Transaction
                let modifiedChunks = 0;
                const client = (db as any).client || (db as any).s?.client;
                
                if (!client) {
                    throw new AppError('INTERNAL_ERROR', 500, 'Database client configuration error');
                }

                const session_db = client.startSession();

                try {
                    const updateStatus = async (mongoSession?: any) => {
                        const updateData: any = { 
                            status: status === 'RESET_PENDING' ? asset.status : status, 
                            updatedAt: new Date(),
                            lastAction: status === 'RESET_PENDING' ? 'FORCE_RESET' : 'STATUS_UPDATE'
                        };
                        
                        if (status === 'RESET_PENDING') {
                            updateData.ingestionStatus = 'PENDING';
                            updateData.totalChunks = 0;
                            updateData.error = null;
                            updateData.progress = 0;
                        }

                        // Update master document
                        await db.collection('knowledge_assets').updateOne(
                            { _id: new ObjectId(documentId) },
                            { $set: updateData },
                            { session: mongoSession }
                        );

                        // Update associated chunks - Use assetId as primary link
                        const chunkFilter = { assetId: documentId, tenantId: asset.tenantId };
                        
                        const resultChunks = await db.collection('document_chunks').updateMany(
                            chunkFilter,
                            { $set: { status: status === 'RESET_PENDING' ? asset.status : status, updatedAt: new Date() } },
                            { session: mongoSession }
                        );

                        modifiedChunks = resultChunks.modifiedCount;
                    };

                    try {
                        await session_db.withTransaction(async () => {
                            await updateStatus(session_db);
                        });
                    } catch (transError: any) {
                        // Fallback to direct update if transactions are not supported
                        await updateStatus();
                    }
                } finally {
                    await session_db.endSession();
                }

                await log({
                    message: `Document ${filename} updated to ${status}`,
                    details: { documentId, status, updatedChunks: modifiedChunks }
                });

                return NextResponse.json({
                    success: true,
                    message: `Status updated to ${status}`,
                    updatedChunks: modifiedChunks
                });

            } catch (error: unknown) {
                if (error instanceof z.ZodError) {
                    throw new ValidationError('Invalid status update data', error.issues);
                }
                return handleApiError(error, 'API_DOC_STATUS_UPDATE', correlationId);
            }
        }
    );
}

export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'PATCH /api/admin/knowledge-assets/status', thresholdMs: 1000 });
