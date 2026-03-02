import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { TicketService } from '@/services/support/TicketService';
import { handleApiError, AppError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { z } from 'zod';

const ReplySchema = z.object({
    content: z.string().min(1, 'El mensaje no puede estar vacío'),
    isInternal: z.boolean().optional().default(false)
});

/**
 * POST /api/support/tickets/[id]/reply
 * Adds a message to an existing ticket.
 * SLA: P95 < 500ms
 */
export const POST = withPerformanceSLA(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('support:ticket', 'update');
        const body = await req.json();

        const { content, isInternal } = ReplySchema.parse(body);

        // Verify ticket access via Service
        await TicketService.getTicketByIdWithAcl(id, session);

        const isSupport = ['ADMIN', 'SUPER_ADMIN', 'SUPPORT'].includes(session.user.role);

        if (isInternal && !isSupport) {
            throw new AppError('FORBIDDEN', 403, 'Solo soporte puede añadir notas internas');
        }

        // Determine author details
        const authorType: 'Support' | 'User' = isSupport ? 'Support' : 'User';
        const authorName = session.user.name || session.user.email || 'Usuario';

        const message = await TicketService.addMessage(id, session.user.tenantId, {
            content,
            author: session.user.id,
            authorType,
            authorName,
            isInternal: !!isInternal
        });

        // Update status automatically
        if (!isInternal) {
            await TicketService.updateStatusOnReply(id, authorType);
        }

        return NextResponse.json({
            success: true,
            message,
            correlationId
        });
    } catch (error) {
        return handleApiError(error, 'API_TICKET_REPLY_POST', correlationId);
    }
}, { endpoint: 'POST /api/support/tickets/[id]/reply', thresholdMs: 500 });
