import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { SpaceInvitationService } from '@/services/tenant/space-invitation-service';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/spaces/invite/verify/[token]
 */
async function GET_internal(
    req: NextRequest,
    context: { params: Promise<{ token: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_SPACES', action: 'VERIFY_INVITATION' },
        async ({ log, correlationId }) => {
            try {
                const { token } = await context.params;

                await log({ message: 'Verifying invitation token', details: { token } });
                const invitation = await SpaceInvitationService.verifyInvitation(token);

                return NextResponse.json({ 
                    success: true, 
                    invitation: {
                        email: invitation.email,
                        spaceId: invitation.spaceId,
                        tenantId: invitation.tenantId,
                        role: invitation.role
                    },
                    correlationId 
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_SPACES_INVITE_VERIFY_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/spaces/invite/verify/[token]', thresholdMs: 1000 });
