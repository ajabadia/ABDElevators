import { NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notification-service';
import { handleApiError, AppError } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/lib/auth';

/**
 * API para gestionar notificaciones de usuario.
 * Fase 10: Platform Governance.
 */
export async function GET() {
    const correlacion_id = uuidv4();
    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const notifications = await NotificationService.listUnread(session.user.id, session.user.tenantId);
        return NextResponse.json({ notifications });

    } catch (error) {
        return handleApiError(error, 'API_NOTIFICATIONS_LIST', correlacion_id);
    }
}

export async function PATCH(request: Request) {
    const correlacion_id = uuidv4();
    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids)) {
            throw new AppError('VALIDATION_ERROR', 400, 'Array de IDs requerido');
        }

        await NotificationService.markAsRead(ids, session.user.tenantId);

        return NextResponse.json({ success: true });

    } catch (error) {
        return handleApiError(error, 'API_NOTIFICATIONS_MARK_READ', correlacion_id);
    }
}
