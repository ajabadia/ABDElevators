import { connectDB } from "@/lib/db";
import {
    Notification,
    NotificationTenantConfigSchema,
    SystemEmailTemplateSchema,
    NotificationSchema
} from "@/lib/schemas";
import { Resend } from 'resend';
import Handlebars from 'handlebars';
import { ObjectId } from 'mongodb';

// Cache simple para evitar lecturas masivas a BD de configs que no cambian mucho
const configCache = new Map<string, { config: any, expires: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutos

let resendInstance: Resend | null = null;
function getResend() {
    if (!resendInstance && process.env.RESEND_API_KEY) {
        resendInstance = new Resend(process.env.RESEND_API_KEY);
    }
    return resendInstance;
}

interface NotificationPayload {
    tenantId: string;
    userId?: string; // Si es null, es un broadcast al tenant (filtrado por roles en config)
    type: 'SYSTEM' | 'ANALYSIS_COMPLETE' | 'RISK_ALERT' | 'BILLING_EVENT' | 'SECURITY_ALERT';
    level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    title: string; // Título default (fallback)
    message: string; // Mensaje default (fallback)
    link?: string;
    metadata?: Record<string, any>;
    language?: string; // 'es' | 'en' | 'fr' ... default 'es'
    extraRecipients?: string[]; // Para casos como invitaciones (emails externos)
}

export class NotificationService {

    /**
     * Envía una notificación a través de los canales configurados por el Tenant.
     * Soporta i18n y plantillas dinámicas.
     */
    static async notify(payload: NotificationPayload): Promise<void> {
        const { tenantId, type, userId, language = 'es', extraRecipients = [] } = payload;

        try {
            // 1. Obtener configuración del Tenant
            const config = await this.getTenantConfig(tenantId);
            const eventConfig = config.events?.[type];

            // Si no existe config específica, usar defaults seguros
            if (!eventConfig || eventConfig.enabled === false) {
                console.log(`[Notification] ${type} disabled for tenant ${tenantId}`);
                return; // Salir si está deshabilitado
            }

            // 2. Determinar destinatarios
            let recipients: Set<string> = new Set();

            // A. Destinatarios de configuración de Tenant
            if (eventConfig.recipients && eventConfig.recipients.length > 0) {
                eventConfig.recipients.forEach((r: string) => recipients.add(r));
            }
            // B. Usuario específico (si aplica)
            if (userId) {
                const userEmail = await this.getUserEmail(userId);
                if (userEmail) recipients.add(userEmail);
            }
            // C. Fallback del Tenant
            if (recipients.size === 0 && !userId && config.fallbackEmail) {
                recipients.add(config.fallbackEmail);
            }
            // D. Destinatarios extra (Invitaciones, CCs explicitos)
            extraRecipients.forEach(r => recipients.add(r));

            const finalRecipients = Array.from(recipients);

            // 3. Persistir notificación (Siempre se guarda para historial, aunque no se envíe email)
            // Esto alimenta la "campanita" en el frontend
            const notifId = await this.persistNotification(payload, finalRecipients[0]); // Se asocia al primer receptor principal o al tenant

            // 4. Procesar Canales
            if (eventConfig.channels.includes('EMAIL') && finalRecipients.length > 0) {
                await this.sendEmail(payload, finalRecipients, eventConfig.customNote, language);

                // Actualizar estado de envío
                await this.markAsSent(notifId, finalRecipients[0]);
            }

            if (eventConfig.channels.includes('IN_APP')) {
                // La persistencia ya cubrió esto, pero podríamos emitir evento Socket.io aquí si tuviéramos
            }

        } catch (error) {
            console.error('[NotificationService] Error:', error);
            // No hacemos throw para no romper el flujo principal de negocio
        }
    }

    /**
     * Helper for migration scripts to seed in-app notifications directly.
     */
    static async notifyInApp(payload: NotificationPayload, correlacionId?: string): Promise<string> {
        // En este contexto, solo persistimos como 'read: false'
        return await this.persistNotification(payload);
    }

    // --- Public Queries ---

    static async listUnread(userId: string, limit = 20): Promise<any[]> {
        const db = await connectDB();
        return await db.collection('notifications')
            .find({
                userId,
                read: false,
                archived: false
            })
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray();
    }

    static async markAsRead(notificationIds: string[]): Promise<void> {
        if (!notificationIds.length) return;

        const db = await connectDB();
        await db.collection('notifications').updateMany(
            { _id: { $in: notificationIds.map(id => new ObjectId(id)) } },
            { $set: { read: true, readAt: new Date() } }
        );
    }

    // --- Private Helpers ---

    private static async getTenantConfig(tenantId: string): Promise<any> {
        // Check cache
        const cached = configCache.get(tenantId);
        if (cached && cached.expires > Date.now()) {
            return cached.config;
        }

        const db = await connectDB();
        const config = await db.collection('notification_configs').findOne({ tenantId });

        if (!config) {
            // Retornar configuración default si no existe
            return {
                tenantId,
                events: {}, // Event loop usará defaults
                fallbackEmail: null
            };
        }

        // Cache update
        configCache.set(tenantId, { config, expires: Date.now() + CACHE_TTL });
        return config;
    }

    private static async getUserEmail(userId: string): Promise<string | null> {
        const db = await connectDB();
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        return user?.email || null;
    }

    private static async persistNotification(payload: NotificationPayload, mainRecipient?: string): Promise<string> {
        const db = await connectDB();
        const notification = {
            tenantId: payload.tenantId,
            userId: payload.userId, // Puede ser null
            type: payload.type,
            level: payload.level,
            title: payload.title,
            message: payload.message,
            link: payload.link,
            emailRecipient: mainRecipient,
            read: false,
            archived: false,
            createdAt: new Date(),
            metadata: payload.metadata
        };

        const res = await db.collection('notifications').insertOne(notification);
        return res.insertedId.toString();
    }

    private static async markAsSent(notifId: string, recipient: string) {
        const db = await connectDB();
        await db.collection('notifications').updateOne(
            { _id: new ObjectId(notifId) },
            { $set: { emailSent: true, emailSentAt: new Date(), emailRecipient: recipient } }
        );
    }

    private static async sendEmail(
        payload: NotificationPayload,
        recipients: string[],
        customNote: string | undefined,
        language: string
    ) {
        const resend = getResend();
        if (!resend) return;

        // 1. Obtener Template del Sistema para ese Tipo e Idioma
        const template = await this.getSystemTemplate(payload.type);

        let subject = payload.title;
        let htmlBody = `<p>${payload.message}</p>`; // Fallback basic HTML

        // 2. Si existe template, compilar con Handlebars
        if (template) {
            // Seleccionar idioma (fallback a 'es')
            const subjTpl = template.subjectTemplates[language] || template.subjectTemplates['es'];
            const bodyTpl = template.bodyHtmlTemplates[language] || template.bodyHtmlTemplates['es'];

            if (bodyTpl) {
                // Datos para el template
                const data = {
                    title: payload.title,
                    message: payload.message,
                    link: payload.link,
                    tenant_custom_note: customNote ? `<div style="background:#fff3cd;padding:10px;border-left:4px solid #ffc107;margin:15px 0;"><strong>Nota Interna:</strong> ${customNote}</div>` : '',
                    ...payload.metadata
                };

                const compiledSubject = Handlebars.compile(subjTpl);
                const compiledBody = Handlebars.compile(bodyTpl);

                subject = compiledSubject(data);
                htmlBody = compiledBody(data);
            }
        } else {
            // Si no hay template de sistema, inyectar customNote manualmente al final
            if (customNote) {
                htmlBody += `<br><br><hr><p><em>Nota interna: ${customNote}</em></p>`;
            }
        }

        // 3. Enviar
        await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'ABD RAG <notifications@abdrag.com>',
            to: recipients,
            subject: subject,
            html: htmlBody
        });

        console.log(`[NotificationService] Email sent to ${recipients.length} recipients. Lang: ${language}`);
    }

    private static async getSystemTemplate(type: string): Promise<any> {
        const db = await connectDB();
        // Buscar template activo para este tipo
        return await db.collection('system_email_templates').findOne({ type, active: true });
    }
}
