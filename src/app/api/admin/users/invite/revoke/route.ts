import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { SpaceInvitationService } from '@/services/space-invitation-service';
import { handleApiError, ValidationError } from '@/lib/errors';
import { generateUUID } from '@/lib/utils';
import { UserRole } from '@/types/roles';
import { z } from 'zod';
import { logEvento } from '@/lib/logger';

const RevokeSchema = z.object({
    token: z.string().min(1),
});

export async function POST(req: NextRequest) {
    const correlationId = generateUUID();

    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
        const body = await req.json();
        const { token } = RevokeSchema.parse(body);

        await SpaceInvitationService.revokeInvitation(token);

        await logEvento({
            level: 'INFO',
            source: 'API_ADMIN_INVITATIONS',
            action: 'REVOKE_INVITATION',
            message: `Invitación revocada por ${session.user.email}`,
            correlationId,
            details: { token }
        });

        return NextResponse.json({
            success: true,
            message: 'Invitación revocada correctamente'
        });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_INVITATIONS', correlationId);
    }
}
