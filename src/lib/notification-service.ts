import { getTenantCollection } from './db-tenant';
import { NotificationSchema, Notification } from './schemas';
import { logEvento } from './logger';
import { ObjectId } from 'mongodb';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Servicio de Notificaciones (Visión 2.0 - Fase 10)
 * Soporta alertas In-App y Email (via Resend).
 */
export class NotificationService {
    /**
     * Envía una notificación In-App.
     */
    static async notifyInApp(data: Partial<Notification>, correlacion_id: string) {
        const validated = NotificationSchema.parse({
            ...data,
            creado: new Date(),
            leido: false
        });

        const { collection } = await getTenantCollection('notifications');
        const result = await collection.insertOne(validated);

        await logEvento({
            nivel: 'DEBUG',
            origen: 'NOTIFICATION_SERVICE',
            accion: 'NOTIFY_IN_APP',
            mensaje: `Notificación enviada a usuario ${validated.usuarioId}`,
            correlacion_id,
            detalles: { tipo: validated.tipo, id: result.insertedId }
        });

        return result;
    }

    /**
     * Envía una notificación por Email.
     */
    static async notifyEmail(to: string, subject: string, html: string, correlacion_id: string) {
        if (!resend) {
            console.warn("Resend API Key not found. Email notification skipped.");
            return null;
        }

        try {
            const result = await resend.emails.send({
                from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
                to,
                subject,
                html
            });

            await logEvento({
                nivel: 'INFO',
                origen: 'NOTIFICATION_SERVICE',
                accion: 'NOTIFY_EMAIL',
                mensaje: `Email enviado a ${to}`,
                correlacion_id,
                detalles: { subject }
            });

            return result;
        } catch (error) {
            console.error("Error sending email:", error);
            return null;
        }
    }

    /**
     * Lista notificaciones no leídas para un usuario.
     */
    static async listUnread(usuarioId: string) {
        const { collection } = await getTenantCollection('notifications');
        return await collection.find({ usuarioId, leido: false }).sort({ creado: -1 }).toArray() as Notification[];
    }

    /**
     * Marca notificaciones como leídas.
     */
    static async markAsRead(ids: string[]) {
        const { collection } = await getTenantCollection('notifications');
        await collection.updateMany(
            { _id: { $in: ids.map(id => new ObjectId(id)) } },
            { $set: { leido: true } }
        );
        return { success: true };
    }
}
