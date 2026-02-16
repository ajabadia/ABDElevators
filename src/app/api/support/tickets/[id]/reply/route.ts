import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TicketService } from '@/lib/ticket-service';
import { AppError, handleApiError, NotFoundError } from '@/lib/errors';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { UserRole } from '@/types/roles';

/**
 * POST /api/support/tickets/[id]/reply
 * Adds a message to an existing ticket (Phase 70 compliance).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const correlationId = crypto.randomUUID();
    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'Debe iniciar sesión');
        }

        const body = await req.json();
        const { content, isInternal } = body;

        if (!content || typeof content !== 'string' || !content.trim()) {
            throw new AppError('VALIDATION_ERROR', 400, 'El mensaje no puede estar vacío');
        }

        // Verify ticket access via Service (Phase 173.1)
        const ticket = await TicketService.getTicketByIdWithAcl(id, session);

        const isSupport = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT].includes(session.user.role as UserRole);

        if (isInternal && !isSupport) {
            throw new AppError('FORBIDDEN', 403, 'Solo soporte puede añadir notas internas');
        }

        // Determine author
        const authorType = isSupport ? 'Support' : 'User';
        const authorName = session.user.name || session.user.email;

        const message = await TicketService.addMessage(id, {
            content,
            author: authorType as any,
            authorName: authorName as string,
            isInternal: !!isInternal
        });

        // Update status automatically (Phase 173.1)
        if (!isInternal) {
            await TicketService.updateStatusOnReply(id, authorType as any);
        }

        return NextResponse.json({ success: true, message });

    } catch (error) {
        return handleApiError(error, 'API_TICKET_REPLY', correlationId);
    }
}
