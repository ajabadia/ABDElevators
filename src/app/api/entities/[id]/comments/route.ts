import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { AppError, handleApiError } from '@/lib/errors';
import { getTenantCollection } from '@/lib/db-tenant';
import { CollaborationCommentSchema } from '@/lib/schemas/collaboration';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';

/**
 * GET /api/entities/[id]/comments
 * Lista los comentarios asociados a una entidad.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const correlationId = crypto.randomUUID();

    try {
        const session = await auth();
        if (!session) throw new AppError('UNAUTHORIZED', 401, 'No autorizado');

        const collection = await getTenantCollection('collaboration_comments');
        const comments = await collection.find(
            { entityId: id },
            { sort: { createdAt: 1 } }
        );

        return NextResponse.json({ success: true, data: comments });
    } catch (error) {
        return handleApiError(error, 'API_COMMENTS_LIST', correlationId);
    }
}

/**
 * POST /api/entities/[id]/comments
 * Crea un nuevo comentario en una entidad.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const correlationId = crypto.randomUUID();

    try {
        const session = await auth();
        if (!session) throw new AppError('UNAUTHORIZED', 401, 'No autorizado');

        const body = await req.json();
        const validated = CollaborationCommentSchema.parse({
            ...body,
            entityId: id,
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Usuario',
            userImage: session.user.image,
        });

        const collection = await getTenantCollection('collaboration_comments');
        const result = await collection.insertOne(validated);

        await logEvento({
            level: 'INFO',
            source: 'API_COMMENTS',
            action: 'CREATE_COMMENT',
            message: `Comentario creado en entidad ${id}`,
            correlationId,
            details: { commentId: result.insertedId }
        });

        return NextResponse.json({ success: true, data: { ...validated, _id: result.insertedId } });
    } catch (error) {
        return handleApiError(error, 'API_COMMENTS_CREATE', correlationId);
    }
}
