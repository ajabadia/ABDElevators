import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { SpaceInvitationService } from '@/services/tenant/space-invitation-service';
import { handleApiError } from '@/lib/errors';
import { z } from 'zod';
import { logEvento } from '@/lib/logger';
import { generateUUID } from '@/lib/utils';
import { requirePermission } from '@/lib/auth';
const AcceptSchema = z.object({
    token: z.string().min(1),
});

async function POST_internal(req: NextRequest) {
    const correlationId = generateUUID();
    try {
        const session = await requirePermission('tenant:members', 'write');
        const body = await req.json();
        const { token } = AcceptSchema.parse(body);

        const invitation = await SpaceInvitationService.validateToken(token);
        await SpaceInvitationService.acceptInvitation(token, session.user.id);

        await logEvento({
            level: 'INFO', source: 'API_SPACES', action: 'ACCEPT_INVITATION',
            message: `Usuario ${session.user.email} aceptó invitación`,
            correlationId, details: { spaceId: invitation.spaceId }
        });

        return NextResponse.json({ success: true, message: 'Invitación aceptada correctamente' });
    } catch (error: unknown) {
        return handleApiError(error, 'API_SPACES', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/spaces/invite/accept', thresholdMs: 1000 });
