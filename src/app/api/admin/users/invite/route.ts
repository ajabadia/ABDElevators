import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { SpaceInvitationService } from '@/services/space-invitation-service';
import { handleApiError } from '@/lib/errors';
import { generateUUID } from '@/lib/utils';
import { UserRole } from '@/types/roles';

export async function GET(req: NextRequest) {
    const correlationId = generateUUID();

    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
        const invitations = await SpaceInvitationService.listInvitations(session.user.tenantId);

        return NextResponse.json({
            success: true,
            invitations
        });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_INVITATIONS', correlationId);
    }
}
