import { NextResponse } from 'next/server';
import { SpaceInvitationService } from '@/services/space-invitation-service';
import { handleApiError } from '@/lib/errors';
import { generateUUID } from '@/lib/utils';
import { logEvento } from '@/lib/logger';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    const correlationId = generateUUID();
    const { token } = await params;

    try {
        const invitation = await SpaceInvitationService.validateToken(token);

        await logEvento({
            level: 'DEBUG',
            source: 'API_SPACES',
            action: 'VERIFY_INVITATION',
            message: `Verificación de token de invitación: ${token}`,
            correlationId,
            details: { spaceId: invitation.spaceId }
        });

        return NextResponse.json({
            success: true,
            invitation
        });

    } catch (error) {
        return handleApiError(error, 'API_SPACES', correlationId);
    }
}
