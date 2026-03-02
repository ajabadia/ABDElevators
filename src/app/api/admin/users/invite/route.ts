import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { SpaceInvitationService } from '@/services/tenant/space-invitation-service';
import { handleApiError } from '@/lib/errors';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();

    try {
        const session = await enforcePermission('user:invite', 'read');
        const invitations = await SpaceInvitationService.listInvitations(session.user.tenantId);

        return NextResponse.json({
            success: true,
            invitations
        });

    } catch (error: unknown) {
        return handleApiError(error, 'API_ADMIN_INVITATIONS_LIST', correlationId);
    }
}
