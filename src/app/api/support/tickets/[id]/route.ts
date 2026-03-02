import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { TicketService } from '@/services/support/TicketService';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/performance-sla';
import crypto from 'crypto';

/**
 * GET /api/support/tickets/[id]
 * Retrieves an individual ticket with its message history.
 */
export const GET = withPerformanceSLA(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('support:ticket', 'read');

        // Get ticket via Service with ACL
        const ticket = await TicketService.getTicketByIdWithAcl(id, session);

        return NextResponse.json({ success: true, ticket });
    } catch (error) {
        return handleApiError(error, 'API_TICKET_GET', correlationId);
    }
}, { p95: 300, max: 1000 });
