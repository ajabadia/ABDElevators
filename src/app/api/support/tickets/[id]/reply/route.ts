import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { TicketService } from '@/services/support/TicketService';
import { handleApiError, AppError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { z } from 'zod';
import { EntityIdSchema, TenantIdSchema } from '@abd/platform-core';
import { withCorrelation } from '@/lib/logger/with-correlation';

const ReplySchema = z.object({
    content: z.string().min(1, 'El mensaje no puede estar vacío'),
    isInternal: z.boolean().optional().default(false)
});

/**
 * POST /api/support/tickets/[id]/reply
 * Adds a message to an existing ticket.
 * SLA: P95 < 500ms
 */
export const POST = withPerformanceSLA(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
    withCorrelation(
        { level: 'INFO', source: 'APISUPPORTTICKET', action: 'REPLYTICKET' },
        async ({ log, correlationId }) => {
            try {
                const { id } = await params;
                const session = await requirePermission('support:ticket', 'update');
                const body = await req.json();

                const { content, isInternal } = ReplySchema.parse(body);

                const ticketId = EntityIdSchema.parse(id);
                const tenantId = TenantIdSchema.parse(session.user.tenantId);

                // Verify ticket access via Service
                await TicketService.getTicketByIdWithAcl(ticketId, session);

                const isSupport = ['ADMIN', 'SUPER_ADMIN', 'SUPPORT'].includes(session.user.role);

                if (isInternal && !isSupport) {
                    throw new AppError('FORBIDDEN', 403, 'Solo soporte puede añadir notas internas');
                }

                // Determine author details
                const authorType: 'Support' | 'User' = isSupport ? 'Support' : 'User';
                const authorName = session.user.name || session.user.email || 'Usuario';

                const message = await TicketService.addMessage(ticketId, tenantId, {
                    content,
                    author: EntityIdSchema.parse(session.user.id),
                    authorType,
                    authorName,
                    isInternal: !!isInternal
                });

                // Update status automatically
                if (!isInternal) {
                    await TicketService.updateStatusOnReply(ticketId, authorType);
                }

                await log({
                    message: 'Support ticket reply added',
                    details: {
                        ticketId: id,
                        isInternal,
                        authorType,
                        tenantId: session.user.tenantId
                    }
                });

                return NextResponse.json({
                    success: true,
                    message,
                    correlationId
                });
            } catch (error) {
                return handleApiError(error, 'APISUPPORTTICKET', correlationId);
            }
        }
    ),
    { endpoint: 'POST /api/support/tickets/[id]/reply', thresholdMs: 500 }
);
