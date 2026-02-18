import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { AppError, handleApiError } from '@/lib/errors';
import { NotificationTypeSchema } from '@/lib/schemas';
import { z } from 'zod';
import crypto from 'crypto';

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

const API_SOURCE = 'API_NOTIFICATIONS_CONFIG';
const SLA_THRESHOLD = 500; // ms

/**
 * GET /api/admin/notifications/config
 * Obtiene la configuración de notificaciones del tenant actual.
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    const start = Date.now();
    try {
        const session = await auth();
        if (!session?.user?.tenantId) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const collection = await getTenantCollection('notification_configs', session, 'LOGS');
        const config = await collection.findOne({ tenantId: session.user.tenantId });

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
                tenantId: session.user.tenantId,
                events: defaultEvents,
                fallbackEmail: session.user?.email || ''
            });
        }

        return NextResponse.json(config);

    } catch (error: any) {
        return handleApiError(error, API_SOURCE, correlacion_id);
    } finally {
        const duration = Date.now() - start;
        if (duration > SLA_THRESHOLD) {
            await logEvento({
                level: 'WARN',
                source: API_SOURCE,
                action: 'SLA_BREACH_GET',
                correlationId: correlacion_id,
                message: `GET Config excedió SLA`,
                details: { duration_ms: duration }
            });
        }
    }
}

/**
 * PUT /api/admin/notifications/config
 * Actualiza la configuración y guarda auditoría.
 */
export async function PUT(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    const start = Date.now();
    try {
        const session = await auth();
        const tenantId = session?.user?.tenantId;
        const userId = session?.user?.id;

        if (!session || !tenantId || !userId || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const body = await req.json();
        const validated = UpdateConfigBodySchema.parse(body);

        const collection = await getTenantCollection('notification_configs', session, 'LOGS');
        const historyCollection = await getTenantCollection('notification_tenant_configs_history', session, 'LOGS');

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
            message: `Configuración de notificaciones actualizada por ${session.user?.email}`,
            correlationId: correlacion_id,
            details: { tenantId, userId, duration_ms: Date.now() - start }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return handleApiError(error, API_SOURCE, correlacion_id);
    } finally {
        const duration = Date.now() - start;
        if (duration > SLA_THRESHOLD * 2) { // Mas margen para escritura
            await logEvento({
                level: 'WARN',
                source: API_SOURCE,
                action: 'SLA_BREACH_PUT',
                correlationId: correlacion_id,
                message: `PUT Config excedió SLA`,
                details: { duration_ms: duration }
            });
        }
    }
}
