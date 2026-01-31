
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { AppError, handleApiError, NotFoundError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/support/tickets/[id]
 * Retrieves an individual ticket with its message history.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const correlationId = crypto.randomUUID();
    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'Debe iniciar sesión');
        }

        const db = await connectDB();

        // Get ticket
        const ticket = await db.collection('tickets').findOne({ _id: new ObjectId(id) });

        if (!ticket) {
            throw new NotFoundError('Ticket no encontrado');
        }

        // Multi-Tenant Security:
        // - ADMIN/SUPER_ADMIN: Check that ticket belongs to a tenant they have access to
        // - USER: Check that they are the ticket creator

        const isSupport = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);

        if (isSupport) {
            // Admin must have access to the ticket's tenant
            const allowedTenants = session.user.role === 'SUPER_ADMIN'
                ? null // SuperAdmin sees everything
                : [
                    (session.user as any).tenantId,
                    ...((session.user as any).tenantAccess || []).map((t: any) => t.tenantId)
                ].filter(Boolean);

            if (allowedTenants && !allowedTenants.includes(ticket.tenantId)) {
                throw new AppError('FORBIDDEN', 403, 'No tienes acceso a este ticket');
            }
        } else {
            // Normal user: only see their own tickets
            if (ticket.createdBy !== session.user.id) {
                throw new AppError('FORBIDDEN', 403, 'No tienes acceso a este ticket');
            }
        }

        return NextResponse.json({ success: true, ticket });

    } catch (error) {
        return handleApiError(error, 'API_TICKET_GET', correlationId);
    }
}
