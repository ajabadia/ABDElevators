import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { auth } from '@/lib/auth';
import { TicketService } from '@/services/support/TicketService';
import { AppError, handleApiError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * POST /api/support/tickets
 * Creates a new ticket.
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('support:ticket', 'create');

        const body = await req.json();

        // User can only create tickets for their own current tenant context
        const ticketInfo = {
            ...body,
            tenantId: session.user.tenantId,
            createdBy: session.user.id,
            userEmail: session.user.email
        };

        const ticket = await TicketService.createTicket(ticketInfo);

        return NextResponse.json({ success: true, ticket });
    } catch (error) {
        return handleApiError(error, 'API_TICKETS_CREATE', correlationId);
    }
}

/**
 * GET /api/support/tickets
 * Lists tickets based on user permissions.
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('support:ticket', 'read');

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || undefined;
        const priority = searchParams.get('priority') || undefined;
        const userEmail = searchParams.get('userEmail') || undefined;

        // Multi-Tenant Permission Logic (Simplified: Service uses shielded wrapper)
        let filterUserId: string | undefined = undefined;

        // If not admin/support, only sees their own tickets
        const isAdmin = session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN' || session.user.role === 'SUPPORT';

        if (!isAdmin) {
            filterUserId = session.user.id;
        } else {
            // Admin list requires explicit permission
            await enforcePermission('support:admin', 'read');
        }

        const tickets = await TicketService.getTickets({
            userId: filterUserId,
            userEmail,
            status: status || undefined,
            priority: priority || undefined
        });

        return NextResponse.json({ success: true, tickets });

    } catch (error) {
        return handleApiError(error, 'API_TICKETS_GET', correlationId);
    }
}
