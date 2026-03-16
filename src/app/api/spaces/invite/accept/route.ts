import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { SpaceInvitationService } from '@/services/tenant/space-invitation-service';
import { handleApiError } from '@/lib/errors';
import { z } from 'zod';
import { withCorrelation } from '@/lib/logger/with-correlation';

const AcceptInviteSchema = z.object({
    token: z.string().min(1),
});

/**
 * POST /api/spaces/invite/accept
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_SPACES', action: 'ACCEPT_INVITATION' },
        async ({ log, correlationId }) => {
            try {
                // Note: requirePermission might not be needed if this is a public join flow, 
                // but usually user must be logged in. 
                const body = await req.json();
                const { token } = AcceptInviteSchema.parse(body);

                await log({ message: 'User attempting to accept invitation', details: { token } });
                
                const result = await SpaceInvitationService.acceptInvitation(token, correlationId);

                await log({ message: 'Invitation accepted successfully', details: { spaceId: result.spaceId } });

                return NextResponse.json({ success: true, spaceId: result.spaceId, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_SPACES_INVITE_ACCEPT_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/spaces/invite/accept', thresholdMs: 1500 });
