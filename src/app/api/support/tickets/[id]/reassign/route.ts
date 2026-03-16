import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { TicketService } from '@/services/support/TicketService';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { z } from 'zod';
import { EntityIdSchema, TenantIdSchema } from '@abd/platform-core';
import { withCorrelation } from '@/lib/logger/with-correlation';

const ReassignSchema = z.object({
    assignedTo: z.string().min(1, 'Se requiere un destinatario'),
    note: z.string().optional()
});

/**
 * POST /api/support/tickets/[id]/reassign
 * Reassigns a ticket to another agent.
 */
export const POST = withPerformanceSLA(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
    withCorrelation(
        { level: 'INFO', source: 'APISUPPORTTICKET', action: 'REASSIGNTICKET' },
        async ({ log, correlationId }) => {
            try {
                const { id } = await params;
                const session = await requirePermission('support:admin', 'update');
                const body = await req.json();

                const validated = ReassignSchema.parse(body);

                const ticketId = EntityIdSchema.parse(id);
                const tenantId = TenantIdSchema.parse(session.user.tenantId);

                // Verify ticket access via Service
                await TicketService.getTicketByIdWithAcl(ticketId, session);

                await TicketService.reassignTicket(ticketId, tenantId, {
                    assignedTo: EntityIdSchema.parse(validated.assignedTo),
                    note: validated.note,
                    authorId: EntityIdSchema.parse(session.user.id)
                });

                await log({
                    message: 'Support ticket reassigned',
                    details: {
                        ticketId: id,
                        assignedTo: validated.assignedTo,
                        tenantId: session.user.tenantId
                    }
                });

                return NextResponse.json({ success: true });
            } catch (error) {
                return handleApiError(error, 'APISUPPORTTICKET', correlationId);
            }
        }
    ),
    { endpoint: 'API /api/support/tickets/[id]/reassign', thresholdMs: 500 }
);
