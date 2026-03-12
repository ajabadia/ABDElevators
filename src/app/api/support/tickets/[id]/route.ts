import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { TicketService } from '@/services/support/TicketService';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { EntityIdSchema } from '@abd/platform-core';

/**
 * GET /api/support/tickets/[id]
 * Retrieves an individual ticket with its message history.
 */
export const GET = withPerformanceSLA(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('support:ticket', 'read');

        // Get ticket via Service with ACL
        const ticket = await TicketService.getTicketByIdWithAcl(EntityIdSchema.parse(id), session);

        return NextResponse.json({ success: true, ticket });
    } catch (error) {
        return handleApiError(error, 'API_TICKET_GET', correlationId);
    }
}, { endpoint: 'GET /api/support/tickets/[id]', thresholdMs: 300 });
