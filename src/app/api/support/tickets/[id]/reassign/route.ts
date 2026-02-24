
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TicketService } from '@/services/support/TicketService';
import { AppError, handleApiError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * PATCH /api/support/tickets/[id]/reassign
 * Reassigns a ticket to another administrator or support level.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const correlationId = crypto.randomUUID();
    try {
        const session = await auth();
        if (!['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')) {
            throw new AppError('FORBIDDEN', 403, 'Solo administradores pueden reasignar');
        }

        const body = await req.json();
        const { assignedTo, note } = body;

        if (!assignedTo) {
            throw new AppError('VALIDATION_ERROR', 400, 'assignedTo es requerido');
        }

        await TicketService.reassignTicket(
            id,
            session?.user?.tenantId as string,
            {
                assignedTo,
                note,
                authorId: session?.user?.id as string
            }
        );

        return NextResponse.json({ success: true });

    } catch (error) {
        return handleApiError(error, 'API_TICKET_REASSIGN', correlationId);
    }
}
