import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { AppError, handleApiError, NotFoundError } from '@/lib/errors';
import crypto from 'crypto';
import { UserRole } from '@/types/roles';

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
            throw new AppError('UNAUTHORIZED', 401, 'api.errors.unauthorized');
        }

        const db = await connectDB();

        // Get ticket
        const ticket = await db.collection('tickets').findOne({ _id: new ObjectId(id) });

        if (!ticket) {
            throw new NotFoundError('api.errors.ticket_not_found');
        }

        // Multi-Tenant Security (Phase 70 RBAC)
        const isSupport = [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(session.user.role as UserRole);

        if (isSupport) {
            // Admin must have access to the ticket's tenant
            const allowedTenants = session.user.role === UserRole.SUPER_ADMIN
                ? null // SuperAdmin sees everything
                : [
                    session.user.tenantId,
                    ...(session.user.tenantAccess || []).map((t: any) => t.tenantId)
                ].filter(Boolean);

            if (allowedTenants && !allowedTenants.includes(ticket.tenantId)) {
                throw new AppError('FORBIDDEN', 403, 'api.errors.forbidden_access');
            }
        } else {
            // Normal user: only see their own tickets
            if (ticket.createdBy !== session.user.id) {
                throw new AppError('FORBIDDEN', 403, 'api.errors.forbidden_access');
            }
        }

        return NextResponse.json({ success: true, ticket });

    } catch (error) {
        return handleApiError(error, 'API_TICKET_GET', correlationId);
    }
}
