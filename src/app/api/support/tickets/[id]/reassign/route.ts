import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { TicketService } from '@/services/support/TicketService';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { z } from 'zod';
import { EntityIdSchema, TenantIdSchema } from '@abd/platform-core';

const ReassignSchema = z.object({
    assignedTo: z.string().min(1, 'Se requiere un destinatario'),
    note: z.string().optional()
});

/**
 * POST /api/support/tickets/[id]/reassign
 * Reassigns a ticket to another agent.
 */
export const POST = withPerformanceSLA(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const correlationId = crypto.randomUUID();
    try {
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

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error, 'API_TICKET_REASSIGN', correlationId);
    }
}, { endpoint: 'API /api/support/tickets/[id]/reassign', thresholdMs: 500 });
