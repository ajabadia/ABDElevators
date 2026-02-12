import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SpaceInvitationService } from '@/services/space-invitation-service';
import { AppError, handleApiError } from '@/lib/errors';
import { z } from 'zod';
import { logEvento } from '@/lib/logger';
import { generateUUID } from '@/lib/utils';

const AcceptSchema = z.object({
    token: z.string().min(1),
});

export async function POST(req: Request) {
    const correlationId = generateUUID();

    try {
        const session = await auth();
        if (!session?.user) throw new AppError('UNAUTHORIZED', 401, 'No autorizado');

        const body = await req.json();
        const { token } = AcceptSchema.parse(body);

        const invitation = await SpaceInvitationService.validateToken(token);
        await SpaceInvitationService.acceptInvitation(token);

        // TODO: Logic to actually grant access (e.g., adding user to a collaborators array in Space document or similar)
        // For now, we just mark the invitation as accepted.

        await logEvento({
            level: 'INFO',
            source: 'API_SPACES',
            action: 'ACCEPT_INVITATION',
            message: `Usuario ${session.user.email} aceptó invitación al espacio ${invitation.spaceId}`,
            correlationId,
            details: { spaceId: invitation.spaceId, token }
        });

        return NextResponse.json({
            success: true,
            message: 'Invitación aceptada correctamente'
        });

    } catch (error) {
        return handleApiError(error, 'API_SPACES', correlationId);
    }
}
