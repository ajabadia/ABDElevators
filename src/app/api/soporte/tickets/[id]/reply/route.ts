
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TicketService } from '@/lib/ticket-service';
import { AppError, handleApiError, NotFoundError } from '@/lib/errors';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';

/**
 * POST /api/soporte/tickets/[id]/reply
 * Añade un mensaje a un ticket existente.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const correlacion_id = crypto.randomUUID();
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

        const db = await connectDB();

        // Verificar acceso al ticket antes de responder
        const ticket = await db.collection('tickets').findOne({ _id: new ObjectId(id) });
        if (!ticket) {
            throw new NotFoundError('Ticket no encontrado');
        }

        const isSupport = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);

        if (isInternal && !isSupport) {
            throw new AppError('FORBIDDEN', 403, 'Solo soporte puede añadir notas internas');
        }

        if (!isSupport && ticket.createdBy !== session.user.id) {
            throw new AppError('FORBIDDEN', 403, 'No tienes permiso para responder a este ticket');
        }

        // Determinar autor
        const authorType = isSupport ? 'Support' : 'User';
        const authorName = session.user.name || session.user.email;

        const message = await TicketService.addMessage(id, {
            content,
            author: authorType,
            authorName: authorName as string,
            isInternal: !!isInternal
        });

        // Actualizar estado automáticamente (Solo si no es interna)
        if (!isInternal) {
            if (authorType === 'User' && ticket.status === 'WAITING_USER') {
                await db.collection('tickets').updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { status: 'OPEN' } }
                );
            } else if (authorType === 'Support' && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') {
                await db.collection('tickets').updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { status: 'WAITING_USER' } }
                );
            }
        }

        return NextResponse.json({ success: true, message });

    } catch (error) {
        return handleApiError(error, 'API_TICKET_REPLY', correlacion_id);
    }
}
