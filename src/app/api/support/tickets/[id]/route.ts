import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth';
import { TicketService } from '@/services/support/TicketService';
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

        // Get ticket via Service with ACL (Phase 173.1)
        const ticket = await TicketService.getTicketByIdWithAcl(id, session);

        return NextResponse.json({ success: true, ticket });

    } catch (error) {
        return handleApiError(error, 'API_TICKET_GET', correlationId);
    }
}
