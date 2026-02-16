import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { AppError, handleApiError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { SpaceInvitation, SpaceInvitationSchema } from '@/lib/schemas/spaces';
import { logEvento } from '@/lib/logger';
import { generateUUID } from '@/lib/utils';
import { SpaceInvitationService } from '@/services/space-invitation-service';
import { ObjectId } from 'mongodb';

/**
 * [PHASE 125.2] Space Invitations API (Admin Context)
 * GET /api/admin/spaces/[id]/invitations
 * POST /api/admin/spaces/[id]/invitations
 */

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = generateUUID();
    try {
        await enforcePermission('knowledge', 'read');
        const { auth } = await import('@/lib/auth');
        const session = await auth();

        const { id } = await params;
        const collection = await getTenantCollection<SpaceInvitation>('space_invitations', session);

        const invitations = await collection.find({ spaceId: id }, { sort: { createdAt: -1 } as any });

        return NextResponse.json({ success: true, invitations });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_SPACES_INVITES', correlationId);
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = generateUUID();
    try {
        const user = await enforcePermission('knowledge', 'manage_spaces');
        const { auth } = await import('@/lib/auth');
        const session = await auth();

        const { id } = await params;
        const body = await req.json();

        const invitation = await SpaceInvitationService.createInvitation({
            spaceId: id,
            email: body.email,
            invitedBy: user.id,
            tenantId: user.tenantId,
            role: body.role || 'VIEWER',
            expiresInDays: body.expiresInDays || 7
        }, session as any);

        await logEvento({
            level: 'INFO',
            source: 'API_ADMIN_SPACES_INVITES',
            action: 'CREATE_INVITATION',
            message: `Invitación creada para ${body.email} en espacio ${id}`,
            correlationId,
            details: { spaceId: id, email: body.email }
        });

        return NextResponse.json({ success: true, invitation }, { status: 201 });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_SPACES_INVITES', correlationId);
    }
}

/**
 * DELETE for revoking/expiring invitations
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = generateUUID();
    try {
        await enforcePermission('knowledge', 'manage_spaces');
        const { auth } = await import('@/lib/auth');
        const session = await auth();

        const { searchParams } = new URL(req.url);
        const inviteId = searchParams.get('inviteId');

        if (!inviteId) throw new AppError('VALIDATION_ERROR', 400, 'inviteId is required');

        const collection = await getTenantCollection<SpaceInvitation>('space_invitations', session);

        const result = await collection.updateOne(
            { _id: new ObjectId(inviteId) },
            { $set: { status: 'REVOKED' } }
        );

        if (result.matchedCount === 0) throw new AppError('NOT_FOUND', 404, 'Invitación no encontrada');

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_SPACES_INVITES', correlationId);
    }
}
