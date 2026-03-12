import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { SessionService } from "@/services/auth/SessionService";
import { AppError } from '@/lib/errors';

/**
 * GET /api/auth/profile/sesiones
 * Retrieves all active sessions for the current user.
 */
async function GET_internal(req: NextRequest) {
    try {
        const session = await requirePermission('profile', 'read');

        const sessions = await SessionService.getUserSessions(session.user.id, session.user.tenantId);

        // Mark the current session so the user knows which one is their present device
        const sessionId = (session as any).sessionId;
        const mappedSessions = sessions.map(s => ({
            ...s,
            isCurrent: s._id?.toString() === sessionId
        }));

        return NextResponse.json({ sessions: mappedSessions });
    } catch (error: unknown) {
        const status = error instanceof AppError ? error.status : 500;
        const message = error instanceof Error ? error.message : 'Unknown session get error';
        return NextResponse.json({ error: message }, { status });
    }
}

/**
 * DELETE /api/auth/profile/sesiones
 * Revokes a specific session (Remote Logout).
 */
async function DELETE_internal(req: NextRequest) {
    try {
        const session = await requirePermission('profile', 'write');

        const { searchParams } = new URL(req.url);
        const targetId = searchParams.get('id');
        const revokeAll = searchParams.get('all') === 'true';

        if (revokeAll) {
            // Revoke all except the current one
            const currentSessionId = (session as any).sessionId;
            await SessionService.revokeAllUserSessions(session.user.id, session.user.tenantId, currentSessionId);
            return NextResponse.json({ success: true, message: 'All other sessions have been closed' });
        }

        if (!targetId) {
            throw new AppError('VALIDATION_ERROR', 400, 'Session ID required');
        }

        const success = await SessionService.revokeSession(targetId, session.user.id, session.user.tenantId);
        return NextResponse.json({ success });
    } catch (error: unknown) {
        const status = error instanceof AppError ? error.status : 500;
        const message = error instanceof Error ? error.message : 'Unknown session delete error';
        return NextResponse.json({ error: message }, { status });
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/auth/profile/sesiones', thresholdMs: 1000 });

export const DELETE = withPerformanceSLA(DELETE_internal, { endpoint: 'DELETE /api/auth/profile/sesiones', thresholdMs: 1000 });
