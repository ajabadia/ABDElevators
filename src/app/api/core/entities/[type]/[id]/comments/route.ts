import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { CollaborationCommentSchema } from '@/lib/schemas/collaboration';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { TenantIdSchema } from '@/lib/schemas';
import { type SafeFilter } from '@/lib/repositories/BaseRepository';

/**
 * GET /api/entities/[id]/comments
 */
async function GET_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_COMMENTS', action: 'LIST_COMMENTS' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('technical:analysis', 'read');
                const { id } = await context.params;
                const tenantId = TenantIdSchema.parse(session.user.tenantId);

                const collection = await getTenantCollection('collaboration_comments', session, 'MAIN');
                const comments = await collection.find(
                    { entityId: id, tenantId } as any,
                    { sort: { createdAt: 1 } }
                );

                return NextResponse.json({ success: true, data: comments, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_COMMENTS_GET', correlationId);
            }
        }
    );
}

/**
 * POST /api/entities/[id]/comments
 */
async function POST_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_COMMENTS', action: 'CREATE_COMMENT' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('technical:analysis', 'write');
                const { id } = await context.params;
                const tenantId = TenantIdSchema.parse(session.user.tenantId);

                const body = await req.json();
                const validated = CollaborationCommentSchema.parse({
                    ...body,
                    entityId: id,
                    tenantId,
                    userId: session.user.id,
                    userName: session.user.name || 'Usuario',
                    userImage: session.user.image,
                });

                const collection = await getTenantCollection('collaboration_comments', session, 'MAIN');
                const result = await collection.insertOne(validated as any);

                await log({
                    message: `Comentario creado en entidad ${id}`,
                    details: { commentId: result.insertedId }
                });

                return NextResponse.json({ success: true, data: { ...validated, _id: result.insertedId }, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_COMMENTS_POST', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/technical/entities/[id]/comments', thresholdMs: 1000 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/technical/entities/[id]/comments', thresholdMs: 1000 });
