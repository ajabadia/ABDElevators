import { NextResponse } from 'next/server';
import { ContactService } from '@/lib/contact-service';
import { handleApiError, AppError } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/lib/auth';

/**
 * Endpoint Admin para gestionar solicitudes de contacto.
 * Fase 10: Platform Governance.
 */
export async function GET() {
    const correlacion_id = uuidv4();
    try {
        const session = await auth();
        // Solo ADMIN o SUPER_ADMIN pueden ver todas las solicitudes
        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            throw new AppError('UNAUTHORIZED', 403, 'No autorizado para gestionar soportes');
        }

        const requests = await ContactService.listAll(session.user.role === 'SUPER_ADMIN' ? undefined : session.user.tenantId);
        return NextResponse.json({ requests });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_CONTACT_LIST', correlacion_id);
    }
}

export async function PATCH(request: Request) {
    const correlacion_id = uuidv4();
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            throw new AppError('UNAUTHORIZED', 403, 'No autorizado');
        }

        const body = await request.json();
        const { id, respuesta } = body;

        if (!id || !respuesta) {
            throw new AppError('VALIDATION_ERROR', 400, 'ID y respuesta requeridos');
        }

        await ContactService.respondRequest(id, respuesta, session.user.id, correlacion_id);

        return NextResponse.json({ success: true });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_CONTACT_RESPOND', correlacion_id);
    }
}
