import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { SpaceInvitationService } from '@/services/tenant/space-invitation-service';
import { handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { z } from 'zod';
import crypto from 'crypto';

const RevokeSchema = z.object({
    token: z.string().min(1),
});

export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();

    try {
        const session = await enforcePermission('user:invite', 'manage');
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

    } catch (error: unknown) {
        return handleApiError(error, 'API_ADMIN_INVITATIONS_REVOKE', correlationId);
    }
}
