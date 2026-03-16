import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { connectDB, connectAuthDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { NotFoundError, handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * DELETE /api/auth/knowledge-assets/[id]
 * Soft-Delete of a knowledge asset (Compliance).
 * SLA: P95 < 1000ms
 */
async function DELETE_internal(
    req: NextRequest,
    paramsContext: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_USER_DOCS', action: 'SOFT_DELETE_DOC' },
        async ({ correlationId, log }) => {
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

                const result = await db.collection('user_documents').findOneAndUpdate(
                    {
                        _id: new ObjectId(id),
                        userId: user._id.toString(), // Security: Only owner
                        anchor: tenantId
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

                await log({
                    message: `Document marked as deleted: ${id}`,
                    details: { docId: id },
                    tenantId
                });

                return NextResponse.json({ success: true });
            } catch (error: unknown) {
                return handleApiError(error, 'API_DOCS_USER_DELETE', correlationId);
            }
        }
    );
}

export const DELETE = withPerformanceSLA(DELETE_internal, { endpoint: 'DELETE /api/auth/knowledge-assets/[id]', thresholdMs: 1000 });
