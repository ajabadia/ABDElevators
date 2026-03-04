import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { TicketService } from '@/services/support/TicketService';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { TicketPrioritySchema, TicketStatusSchema } from '@/lib/schemas/ticketing';
import { z } from 'zod';

const CreateTicketSchema = z.object({
    subject: z.string().min(5),
    description: z.string().min(20),
    priority: TicketPrioritySchema.optional(),
    category: z.string().optional(),
    attachments: z.array(z.object({
        filename: z.string(),
        url: z.string(),
        cloudinaryId: z.string()
    })).optional()
});

/**
 * POST /api/support/tickets
 * Creates a new ticket.
 * SLA: P95 < 500ms
 */
export const POST = withPerformanceSLA(async (req: NextRequest) => {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('support:ticket', 'create');
        const body = await req.json();

        const validated = CreateTicketSchema.parse(body);

        const ticket = await TicketService.createTicket({
            ...validated,
            tenantId: session.user.tenantId,
            createdBy: session.user.id,
            userEmail: session.user.email || ''
        });

        return NextResponse.json({
            success: true,
            ticket,
            correlationId
        });
    } catch (error) {
        return handleApiError(error, 'API_TICKETS_CREATE_POST', correlationId);
    }
}, { endpoint: 'POST /api/support/tickets', thresholdMs: 500 });

/**
 * GET /api/support/tickets
 * Lists tickets based on user permissions.
 */
export const GET = withPerformanceSLA(async (req: NextRequest) => {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('support:ticket', 'read');

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || undefined;
        const priority = searchParams.get('priority') || undefined;
        // userEmail filter is restricted to support/admin
        const userEmail = searchParams.get('userEmail') || undefined;

        let filterUserId: string | undefined = undefined;
        const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'].includes(session.user.role);

        if (!isAdmin) {
            filterUserId = session.user.id;
        } else if (userEmail) {
            // Support check for explicit admin permission if filtering by others emails
            await enforcePermission('support:admin', 'read');
        }

        const tickets = await TicketService.getTickets({
            userId: filterUserId,
            tenantId: session.user.tenantId,
            status: status ? TicketStatusSchema.parse(status) : undefined,
            priority: priority ? TicketPrioritySchema.parse(priority) : undefined,
            limit: 50
        });

        return NextResponse.json({ success: true, tickets });
    } catch (error) {
        return handleApiError(error, 'API_TICKETS_GET', correlationId);
    }
}, { endpoint: 'GET /api/support/tickets', thresholdMs: 300 });
