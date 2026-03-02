import { NextRequest, NextResponse } from 'next/server';
import { connectLogsDB } from '@/lib/db';
import { enforcePermission } from '@/lib/guardian-guard';
import { handleApiError } from '@/lib/errors';
import { NotificationTypeSchema } from '@/lib/schemas';
import crypto from 'crypto';

/**
 * GET /api/admin/notifications/templates
 * Lista todas las plantillas de email del sistema.
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        await enforcePermission('notification:template', 'read');

        const db = await connectLogsDB();

        // Obtener todas las plantillas
        const templates = await db.collection('notification_templates')
            .find({})
            .sort({ type: 1 })
            .toArray();

        // Si no hay plantillas, podríamos devolver las "por defecto" que el sistema espera
        // basándonos en NotificationTypeSchema
        const allTypes = NotificationTypeSchema.options;
        const missingTypes = allTypes.filter(t => !templates.find(tpl => tpl.type === t));

        return NextResponse.json({
            templates,
            missingTypes // Para que el frontend sepa que puede "crear/seedear" estas
        });

    } catch (error: unknown) {
        return handleApiError(error, 'API_ADMIN_NOTIFICATIONS_TEMPLATES_GET', correlationId);
    }
}
