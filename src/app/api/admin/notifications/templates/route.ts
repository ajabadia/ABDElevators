import { NextRequest, NextResponse } from 'next/server';
import { connectLogsDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { NotificationTypeSchema } from '@/lib/schemas';

/**
 * GET /api/admin/notifications/templates
 * Lista todas las plantillas de email del sistema.
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await auth();
        if (session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('FORBIDDEN', 403, 'Solo SuperAdmin puede gestionar plantillas globales');
        }

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

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: error.status || 500 }
        );
    }
}
