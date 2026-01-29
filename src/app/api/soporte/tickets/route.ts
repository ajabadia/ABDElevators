
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TicketService } from '@/lib/ticket-service';
import { AppError, handleApiError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * POST /api/soporte/tickets
 * Crea un ticket nuevo.
 */
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'Debe iniciar sesión');
        }

        const body = await req.json();

        // El usuario solo puede crear tickets para SU propio tenant context actual
        const ticketInfo = {
            ...body,
            tenantId: session.user.tenantId,
            createdBy: session.user.id,
            userEmail: session.user.email
        };

        const ticket = await TicketService.createTicket(ticketInfo);

        return NextResponse.json({ success: true, ticket });
    } catch (error) {
        return handleApiError(error, 'API_TICKETS_CREATE', correlacion_id);
    }
}

/**
 * GET /api/soporte/tickets
 * Lista tickets según permisos del usuario.
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await auth();
        if (!session?.user) throw new AppError('UNAUTHORIZED', 401, 'No autorizado');

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || undefined;
        const priority = searchParams.get('priority') || undefined;
        const userEmail = searchParams.get('userEmail') || undefined;

        // Lógica de Permisos Multi-Tenant (Simplificada: el Service usa el wrapper blindado)
        let filterUserId: string | undefined = undefined;

        // Si no es admin/soporte, solo ve sus propios tickets
        if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN' && session.user.role !== 'SUPPORT') {
            filterUserId = session.user.id;
        }

        const tickets = await TicketService.getTickets({
            userId: filterUserId,
            userEmail,
            status: status || undefined,
            priority: priority || undefined
        });

        return NextResponse.json({ success: true, tickets });

    } catch (error) {
        return handleApiError(error, 'API_TICKETS_GET', correlacion_id);
    }
}
