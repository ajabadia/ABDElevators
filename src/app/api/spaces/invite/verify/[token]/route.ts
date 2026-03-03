import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { SpaceInvitationService } from '@/services/tenant/space-invitation-service';
import { handleApiError } from '@/lib/errors';
import { generateUUID } from '@/lib/utils';
import { logEvento } from '@/lib/logger';

async function GET_internal(
    req: NextRequest,
    context: { params: { token: string } }
) {
    const correlationId = generateUUID();
    try {
        const { token } = context.params;
        const invitation = await SpaceInvitationService.validateToken(token);

        await logEvento({
            level: 'DEBUG', source: 'API_SPACES', action: 'VERIFY_INVITATION',
            message: `Verificación de token: ${token}`,
            correlationId, details: { spaceId: invitation.spaceId }
        });

        return NextResponse.json({ success: true, invitation });
    } catch (error: unknown) {
        return handleApiError(error, 'API_SPACES', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/spaces/invite/verify/[token]', thresholdMs: 1000 });
