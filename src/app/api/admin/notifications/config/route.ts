import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { NotificationTypeSchema } from '@/lib/schemas';
import { z } from 'zod';

const UpdateConfigBodySchema = z.object({
    events: z.record(z.string(), z.object({
        enabled: z.boolean(),
        channels: z.array(z.enum(['EMAIL', 'IN_APP', 'PUSH'])),
        recipients: z.array(z.string().email()),
        customNote: z.string().optional(),
        includeCustomNote: z.boolean().optional()
    })),
    fallbackEmail: z.string().email().optional().nullable()
});

/**
 * GET /api/admin/notifications/config
 * Obtiene la configuración de notificaciones del tenant actual.
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        const tenantId = (session?.user as any)?.tenantId;

        if (!session || !tenantId || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const db = await connectDB();
        const config = await db.collection('notification_configs').findOne({ tenantId });

        // Si no existe, devolvemos un objeto base con los tipos conocidos
        if (!config) {
            const defaultEvents: Record<string, any> = {};
            NotificationTypeSchema.options.forEach(type => {
                defaultEvents[type] = {
                    enabled: true,
                    channels: ['EMAIL', 'IN_APP'],
                    recipients: [],
                    customNote: '',
                    includeCustomNote: true
                };
            });

            return NextResponse.json({
                tenantId,
                events: defaultEvents,
                fallbackEmail: session.user?.email || ''
            });
        }

        return NextResponse.json(config);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}

/**
 * PUT /api/admin/notifications/config
 * Actualiza la configuración y guarda auditoría.
 */
export async function PUT(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await auth();
        const tenantId = (session?.user as any)?.tenantId;
        const userId = session?.user?.id;

        if (!session || !tenantId || !userId || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const body = await req.json();
        const validated = UpdateConfigBodySchema.parse(body);

        const db = await connectDB();
        const collection = db.collection('notification_configs');
        const historyCollection = db.collection('notification_tenant_configs_history');

        const currentConfig = await collection.findOne({ tenantId });

        const updateData = {
            tenantId,
            events: validated.events,
            fallbackEmail: validated.fallbackEmail,
            updatedAt: new Date(),
            updatedBy: userId
        };

        // 1. Guardar en histórico
        await historyCollection.insertOne({
            tenantId,
            configId: currentConfig?._id,
            eventsSnapshot: validated.events,
            action: 'UPDATE_SETTINGS',
            performedBy: userId,
            timestamp: new Date()
        });

        // 2. Upsert de la configuración
        await collection.updateOne(
            { tenantId },
            { $set: updateData },
            { upsert: true }
        );

        await logEvento({
            level: 'INFO',
            source: 'TENANT_NOTIFICATIONS',
            action: 'UPDATE_CONFIG',
            message: `Configuración de notificaciones actualizada por ${session.user?.email}`, correlationId: correlacion_id,
            details: { tenantId, userId }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Datos de configuración inválidos', details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
