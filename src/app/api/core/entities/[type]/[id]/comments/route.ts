import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { CollaborationCommentSchema } from '@/lib/schemas/collaboration';
import { logEvento } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';

/**
 * GET /api/entities/[id]/comments
 */
async function GET_internal(
    req: NextRequest,
    context: { params: { id: string } }
) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('technical:analysis', 'read');
        const { id } = context.params;

        const collection = await getTenantCollection('collaboration_comments', session);
        const comments = await collection.find(
            { entityId: id },
            { sort: { createdAt: 1 } }
        );

        return NextResponse.json({ success: true, data: comments });
    } catch (error: unknown) {
        return handleApiError(error, 'API_COMMENTS_LIST', correlationId);
    }
}

/**
 * POST /api/entities/[id]/comments
 */
async function POST_internal(
    req: NextRequest,
    context: { params: { id: string } }
) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('technical:analysis', 'write');
        const { id } = context.params;

        const body = await req.json();
        const validated = CollaborationCommentSchema.parse({
            ...body,
            entityId: id,
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Usuario',
            userImage: session.user.image,
        });

        const collection = await getTenantCollection('collaboration_comments', session);
        const result = await collection.insertOne(validated as any);

        await logEvento({
            level: 'INFO',
            source: 'API_COMMENTS',
            action: 'CREATE_COMMENT',
            message: `Comentario creado en entidad ${id}`,
            correlationId,
            details: { commentId: result.insertedId }
        });

        return NextResponse.json({ success: true, data: { ...validated, _id: result.insertedId } });
    } catch (error: unknown) {
        return handleApiError(error, 'API_COMMENTS_CREATE', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/technical/entities/[id]/comments', thresholdMs: 1000 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/technical/entities/[id]/comments', thresholdMs: 1000 });
