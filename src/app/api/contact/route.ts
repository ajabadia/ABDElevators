import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextResponse } from 'next/server';
import { ContactService } from '@/services/support/ContactService';
import { handleApiError } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/lib/auth';

/**
 * Endpoint público/semi-público para enviar mensajes de contacto.
 * Fase 10: Soporte Técnico.
 */
async function POST_internal (request: Request) {
    const correlacion_id = uuidv4();
    try {
        const body = await request.json();
        const session = await auth();

        const data = {
            ...body,
            tenantId: session?.user?.tenantId,
            usuarioId: session?.user?.id
        };

        const result = await ContactService.createRequest(data, correlacion_id);

        return NextResponse.json({
            success: true,
            requestId: result.insertedId,
            message: 'Solicitud enviada correctamente. Un administrador se pondrá en contacto pronto.'
        });

    } catch (error) {
        return handleApiError(error, 'API_CONTACT_PUBLIC', correlacion_id);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/contact', thresholdMs: 1000 });
