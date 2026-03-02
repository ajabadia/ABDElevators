import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { TicketService } from '@/services/support/TicketService';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/performance-sla';
import { z } from 'zod';
import crypto from 'crypto';

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
        const session = await enforcePermission('support:admin', 'update');
        const body = await req.json();

        const validated = ReassignSchema.parse(body);

        // Verify ticket access via Service
        await TicketService.getTicketByIdWithAcl(id, session);

        await TicketService.reassignTicket(id, session.user.tenantId, {
            assignedTo: validated.assignedTo,
            note: validated.note,
            authorId: session.user.id
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error, 'API_TICKET_REASSIGN', correlationId);
    }
}, { p95: 500, max: 2000 });
