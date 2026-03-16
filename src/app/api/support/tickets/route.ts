import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { TicketService } from '@/services/support/TicketService';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { TicketPrioritySchema, TicketStatusSchema } from '@/lib/schemas/ticketing';
import { z } from 'zod';
import { TenantIdSchema, EntityIdSchema } from '@abd/platform-core';
import { withCorrelation } from '@/lib/logger/with-correlation';

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
export const POST = withPerformanceSLA(async (req: NextRequest) =>
    withCorrelation(
        { level: 'INFO', source: 'APISUPPORTTICKETS', action: 'CREATETICKET' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('support:ticket', 'create');
                const body = await req.json();

                const validated = CreateTicketSchema.parse(body);

                const ticket = await TicketService.createTicket({
                    ...validated,
                    tenantId: TenantIdSchema.parse(session.user.tenantId),
                    createdBy: EntityIdSchema.parse(session.user.id),
                    userEmail: session.user.email || ''
                });

                await log({
                    message: 'Support ticket created',
                    details: {
                        ticketId: ticket.id,
                        priority: validated.priority,
                        tenantId: session.user.tenantId
                    }
                });

                return NextResponse.json({
                    success: true,
                    ticket,
                    correlationId
                });
            } catch (error) {
                return handleApiError(error, 'APISUPPORTTICKETS', correlationId);
            }
        }
    ),
    { endpoint: 'POST /api/support/tickets', thresholdMs: 500 }
);

/**
 * GET /api/support/tickets
 * Lists tickets based on user permissions.
 */
export const GET = withPerformanceSLA(async (req: NextRequest) =>
    withCorrelation(
        { level: 'INFO', source: 'APISUPPORTTICKETS', action: 'LISTTICKETS' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('support:ticket', 'read');

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
                    await requirePermission('support:admin', 'read');
                }

                const tickets = await TicketService.getTickets({
                    userId: filterUserId ? EntityIdSchema.parse(filterUserId) : undefined,
                    tenantId: TenantIdSchema.parse(session.user.tenantId),
                    status: status ? TicketStatusSchema.parse(status) : undefined,
                    priority: priority ? TicketPrioritySchema.parse(priority) : undefined,
                    limit: 50
                });

                await log({
                    message: 'Support tickets listed',
                    details: {
                        count: tickets.length,
                        tenantId: session.user.tenantId,
                        isAdminView: isAdmin
                    }
                });

                return NextResponse.json({ success: true, tickets });
            } catch (error) {
                return handleApiError(error, 'APISUPPORTTICKETS', correlationId);
            }
        }
    ),
    { endpoint: 'GET /api/support/tickets', thresholdMs: 300 }
);
