import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { SpaceInvitationService } from '@/services/tenant/space-invitation-service';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

async function GET_internal (req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_INVITATIONS', action: 'LIST' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('user:invite', 'read');
                const invitations = await SpaceInvitationService.listInvitations(session.user.tenantId);

                await log({
                    message: `Admin retrieved ${invitations.length} invitations`,
                    details: { tenantId: session.user.tenantId }
                });

                return NextResponse.json({
                    success: true,
                    invitations
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_INVITATIONS_LIST', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/users/invite', thresholdMs: 1000 });
