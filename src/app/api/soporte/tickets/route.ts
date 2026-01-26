
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

        // Lógica de Permisos Multi-Tenant (Igual que en Logs)
        let allowedTenants: string[] = [];
        let filterUserId: string | undefined = undefined;

        if (session.user.role === 'SUPER_ADMIN') {
            // Ve todo (o filtra por tenant si quiere)
            allowedTenants = []; // Si vacío en service -> debería manejar "todos" o lógica especial
            // Para simplificar, en Service si tenantIds está vacío y es superadmin, buscaríamos todos.
            // Pero aquí vamos a pasar todos los tenants activos si es necesario, o un wildcard.
            // MEJORA: Obtener lista real de tenants si es SuperAdmin, o usar un flag *
            // Por seguridad, SuperAdmin verá los de su contexto o todos si es explícito.
            // En V1: Ver tickets DEL TENANT EN EL QUE ESTA O TODOS? 
            // SuperAdmin suele querer ver todo.
            const allTenants = await import('@/lib/tenant-service').then(m => m.TenantService.getAllTenants());
            allowedTenants = allTenants.map(t => t.tenantId);

        } else if (session.user.role === 'ADMIN') {
            // Ve los de sus tenants permitidos
            allowedTenants = [
                (session.user as any).tenantId,
                ...((session.user as any).tenantAccess || []).map((t: any) => t.tenantId)
            ].filter(Boolean);
        } else {
            // Usuario normal (TECNICO/COMERCIAL): Solo ve SUS tickets de SU tenant
            allowedTenants = [session.user.tenantId];
            filterUserId = session.user.id;
        }

        const tickets = await TicketService.getTickets({
            tenantIds: allowedTenants,
            userId: filterUserId,
            userEmail,
            status,
            priority
        });

        return NextResponse.json({ success: true, tickets });

    } catch (error) {
        return handleApiError(error, 'API_TICKETS_GET', correlacion_id);
    }
}
