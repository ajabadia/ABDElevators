import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SessionService } from '@/lib/session-service';
import { AppError } from '@/lib/errors';

/**
 * GET /api/auth/perfil/sesiones
 * Obtiene todas las sesiones activas del usuario actual.
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const sessions = await SessionService.getUserSessions(session.user.id);

        // Marcamos la sesión actual para que el usuario sepa cuál es su dispositivo presente
        const sessionId = (session as any).sessionId;
        const mappedSessions = sessions.map(s => ({
            ...s,
            isCurrent: s._id?.toString() === sessionId
        }));

        return NextResponse.json({ sessions: mappedSessions });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}

/**
 * DELETE /api/auth/perfil/sesiones
 * Revoca una sesión específica (Logout remoto).
 */
export async function DELETE(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

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
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
