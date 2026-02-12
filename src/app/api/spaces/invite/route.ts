import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SpaceInvitationService } from '@/services/space-invitation-service';
import { AppError, handleApiError } from '@/lib/errors';
import { z } from 'zod';
import { logEvento } from '@/lib/logger';
import { generateUUID } from '@/lib/utils';

const InviteSchema = z.object({
    spaceId: z.string().min(1),
    email: z.string().email(),
    role: z.enum(['VIEWER', 'EDITOR', 'ADMIN']).default('VIEWER'),
    expiresInDays: z.number().int().min(1).max(30).default(7),
});

export async function POST(req: Request) {
    const correlationId = generateUUID();
    const start = Date.now();

    try {
        const session = await auth();
        if (!session?.user) throw new AppError('UNAUTHORIZED', 401, 'No autorizado');

        const body = await req.json();
        const validated = InviteSchema.parse(body);

        const invitation = await SpaceInvitationService.createInvitation({
            ...validated,
            invitedBy: session.user.id,
            tenantId: session.user.tenantId,
        });

        await logEvento({
            level: 'INFO',
            source: 'API_SPACES',
            action: 'CREATE_INVITATION',
            message: `Invitación creada para ${validated.email} al espacio ${validated.spaceId}`,
            correlationId,
            details: { spaceId: validated.spaceId, invitedEmail: validated.email }
        });

        const duration = Date.now() - start;
        return NextResponse.json({
            success: true,
            invitation,
            duration_ms: duration
        });

    } catch (error) {
        return handleApiError(error, 'API_SPACES', correlationId);
    }
}
