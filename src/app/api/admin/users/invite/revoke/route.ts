import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { SpaceInvitationService } from '@/services/tenant/space-invitation-service';
import { handleApiError } from '@/lib/errors';
import { z } from 'zod';
import { withCorrelation } from '@/lib/logger/with-correlation';

const RevokeSchema = z.object({
    token: z.string().min(1),
});

async function POST_internal (req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_INVITATIONS', action: 'REVOKE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('user:invite', 'manage');
                const body = await req.json();
                const { token } = RevokeSchema.parse(body);

                await SpaceInvitationService.revokeInvitation(token);

                await log({
                    message: `Invitación revocada por ${session.user.email}`,
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
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/users/invite/revoke', thresholdMs: 1000 });
