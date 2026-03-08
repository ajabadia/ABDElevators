import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { SpaceInvitationService } from '@/services/tenant/space-invitation-service';
import { handleApiError } from '@/lib/errors';
import { z } from 'zod';
import { logEvento } from '@/lib/logger';
import { generateUUID } from '@/lib/utils';
import { requirePermission } from '@/lib/auth';
const InviteSchema = z.object({
    spaceId: z.string().min(1),
    email: z.string().email(),
    role: z.enum(['VIEWER', 'EDITOR', 'ADMIN']).default('VIEWER'),
    expiresInDays: z.number().int().min(1).max(30).default(7),
});

async function POST_internal(req: NextRequest) {
    const correlationId = generateUUID();
    try {
        const session = await requirePermission('tenant:members', 'write');
        const body = await req.json();
        const validated = InviteSchema.parse(body);

        const invitation = await SpaceInvitationService.createInvitation({
            ...validated, invitedBy: session.user.id, tenantId: session.user.tenantId,
        });

        await logEvento({
            level: 'INFO', source: 'API_SPACES', action: 'CREATE_INVITATION',
            message: `Invitación creada para ${validated.email}`,
            correlationId, details: { spaceId: validated.spaceId }
        });

        return NextResponse.json({ success: true, invitation });
    } catch (error: unknown) {
        return handleApiError(error, 'API_SPACES', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/spaces/invite', thresholdMs: 1000 });
