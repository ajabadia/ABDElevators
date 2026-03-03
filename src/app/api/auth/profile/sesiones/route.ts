import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { SessionService } from "@/services/auth/SessionService";
import { AppError } from '@/lib/errors';

/**
 * GET /api/auth/profile/sesiones
 * Obtiene todas las sesiones activas del usuario actual.
 */
async function GET_internal(req: NextRequest) {
    try {
        const session = await enforcePermission('profile', 'read');

        const sessions = await SessionService.getUserSessions(session.user.id);

        // Marcamos la sesión actual para que el usuario sepa cuál es su dispositivo presente
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
 * Revoca una sesión específica (Logout remoto).
 */
async function DELETE_internal(req: NextRequest) {
    try {
        const session = await enforcePermission('profile', 'write');

        const { searchParams } = new URL(req.url);
        const targetId = searchParams.get('id');
        const revokeAll = searchParams.get('all') === 'true';

        if (revokeAll) {
            // Revocar todas menos la actual
            const currentSessionId = (session as any).sessionId;
            await SessionService.revokeAllUserSessions(session.user.id, currentSessionId);
            return NextResponse.json({ success: true, message: 'Todas las demás sesiones han sido cerradas' });
        }

        if (!targetId) {
            throw new AppError('VALIDATION_ERROR', 400, 'ID de sesión requerido');
        }

        const success = await SessionService.revokeSession(targetId, session.user.id);
        return NextResponse.json({ success });
    } catch (error: unknown) {
        const status = error instanceof AppError ? error.status : 500;
        const message = error instanceof Error ? error.message : 'Unknown session delete error';
        return NextResponse.json({ error: message }, { status });
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/auth/profile/sesiones', thresholdMs: 1000 });

export const DELETE = withPerformanceSLA(DELETE_internal, { endpoint: 'DELETE /api/auth/profile/sesiones', thresholdMs: 1000 });
