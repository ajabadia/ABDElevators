
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { AppError, handleApiError, NotFoundError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/soporte/tickets/[id]
 * Obtiene un ticket individual con su historial de mensajes.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'Debe iniciar sesión');
        }

        const db = await connectDB();

        // Obtener el ticket
        const ticket = await db.collection('tickets').findOne({ _id: new ObjectId(id) });

        if (!ticket) {
            throw new NotFoundError('Ticket no encontrado');
        }

        // Seguridad Multi-Tenant:
        // - Si es ADMIN/SUPER_ADMIN: Verificar que el ticket pertenece a un tenant al que tiene acceso
        // - Si es USER: Verificar que es el creador del ticket

        const isSupport = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);

        if (isSupport) {
            // Admin debe tener acceso al tenant del ticket
            const allowedTenants = session.user.role === 'SUPER_ADMIN'
                ? null // SuperAdmin ve todo
                : [
                    (session.user as any).tenantId,
                    ...((session.user as any).tenantAccess || []).map((t: any) => t.tenantId)
                ].filter(Boolean);

            if (allowedTenants && !allowedTenants.includes(ticket.tenantId)) {
                throw new AppError('FORBIDDEN', 403, 'No tienes acceso a este ticket');
            }
        } else {
            // Usuario normal: solo ve sus propios tickets
            if (ticket.createdBy !== session.user.id) {
                throw new AppError('FORBIDDEN', 403, 'No tienes acceso a este ticket');
            }
        }

        return NextResponse.json({ success: true, ticket });

    } catch (error) {
        return handleApiError(error, 'API_TICKET_GET', correlacion_id);
    }
}
