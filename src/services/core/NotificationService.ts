import { NotificationTemplateService } from '../infra/email/notification-template-service';
import { NotificationEmailSender } from '../infra/email/notification-email-sender';
import { NotificationRepository } from './notifications/NotificationRepository';
import { NotificationConfigService } from './notifications/NotificationConfigService';
import { getTenantCollection } from '@/lib/db-tenant';
import { Notification, NotificationSchema, NotificationTemplate, NotificationTemplateSchema } from '@/lib/schemas/notifications';
import { z } from 'zod';

export interface NotificationPayload {
    tenantId: string;
    userId?: string;
    type: 'SYSTEM' | 'ANALYSIS_COMPLETE' | 'RISK_ALERT' | 'BILLING_EVENT' | 'SECURITY_ALERT';
    level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, unknown>;
    language?: string;
    extraRecipients?: string[];
}

/**
 * NotificationService
 * Orchestrator for the notification sub-system.
 * Refactored Phase 8.3: Delegating logic to specialized repository and config services.
 * Refactored Phase 10: Unified with Admin Notification Service.
 */
export class NotificationService {
    private static COLLECTION = 'notifications';
    private static TEMPLATES_COLLECTION = 'notification_templates';

    /**
     * Core notification orchestration. (MAIN Cluster via Repository)
     */
    static async notify(payload: NotificationPayload): Promise<void> {
        const { tenantId, type, userId, language = 'es', extraRecipients = [] } = payload;

        try {
            const config = await NotificationConfigService.getTenantConfig(tenantId);
            let eventConfig = ((config.events || {}) as Record<string, { enabled?: boolean, channels?: string[], recipients?: string[], customNote?: string }>)[type] || {
                enabled: true,
                channels: ['EMAIL', 'IN_APP'],
                recipients: []
            };

            if (eventConfig.enabled === false) return;

            // Determine recipients
            let recipientsSet: Set<string> = new Set();
            let userPrefs = userId ? await NotificationConfigService.getUserPreferences(userId, tenantId, type) : { email: true, inApp: true };

            if (eventConfig.recipients && eventConfig.recipients.length > 0) {
                eventConfig.recipients.forEach((r: string) => recipientsSet.add(r));
            }

            if (userId && userPrefs.email) {
                const userEmail = await NotificationConfigService.getUserEmail(userId, tenantId);
                if (userEmail) recipientsSet.add(userEmail);
            }

            if (recipientsSet.size === 0 && !userId && config.fallbackEmail) {
                recipientsSet.add(config.fallbackEmail as string);
            }

            extraRecipients.forEach(r => recipientsSet.add(r));
            const recipients = Array.from(recipientsSet);

            // Persist In-App
            let notifId: string | null = null;
            if (userPrefs.inApp || !userId) {
                notifId = await NotificationRepository.create(payload, recipients[0]);
            }

            // Process Channels
            if (eventConfig.channels && eventConfig.channels.includes('EMAIL') && recipients.length > 0) {
                await this.deliverEmail(payload, recipients, eventConfig.customNote, language);
                if (notifId) await NotificationRepository.markAsSent(notifId, tenantId, recipients[0]);
            }

        } catch (error: unknown) {
            console.error('[NotificationService] Error:', error);
        }
    }

    private static async deliverEmail(payload: NotificationPayload, recipients: string[], customNote: string | undefined, language: string) {
        const template = await NotificationConfigService.getSystemTemplate(payload.type, payload.tenantId);
        let subject = payload.title;
        let htmlBody = `<p>${payload.message}</p>`;

        if (template) {
            const branding = await NotificationTemplateService.getBrandingData(payload.tenantId);
            const subjTpl = template.subjectTemplates[language] || template.subjectTemplates['es'];
            const bodyTpl = template.bodyHtmlTemplates[language] || template.bodyHtmlTemplates['es'];

            if (bodyTpl) {
                const data = {
                    title: payload.title,
                    message: payload.message,
                    link: payload.link,
                    tenant_custom_note: customNote ? `<div style="background:#fff3cd;padding:10px;border-left:4px solid #ffc107;margin:15px 0;"><strong>Nota Interna:</strong> ${customNote}</div>` : '',
                    ...branding,
                    ...payload.metadata
                };

                subject = NotificationTemplateService.compile(subjTpl, data);
                htmlBody = NotificationTemplateService.compile(bodyTpl, data);
            }
        } else if (customNote) {
            htmlBody += `<br><br><hr><p><em>Nota interna: ${customNote}</em></p>`;
        }

        await NotificationEmailSender.send({
            to: recipients,
            subject,
            html: htmlBody
        });
    }

    // --- Analytics & Templates (LOGS Cluster) ---

    /**
     * Gets notification statistics for the dashboard.
     */
    static async getStats(tenantId?: string): Promise<{ totalSent: number, totalErrors: number, totalBilling: number }> {
        try {
            // Using a dummy session object for getTenantCollection compatibility (Era 12)
            const session = tenantId ? { user: { tenantId, role: 'ADMIN' } } : null;
            const collection = await getTenantCollection(this.COLLECTION, session as any, 'LOGS');

            const query = tenantId ? { tenantId } : {};

            const [totalSent, totalErrors, totalBilling] = await Promise.all([
                collection.countDocuments({ ...query, emailSent: true }),
                collection.countDocuments({ ...query, level: 'ERROR' }),
                collection.countDocuments({ ...query, type: 'BILLING_EVENT' })
            ]);

            return { totalSent, totalErrors, totalBilling };
        } catch (error: unknown) {
            console.error('[NotificationService] Error fetching stats:', error);
            return { totalSent: 0, totalErrors: 0, totalBilling: 0 };
        }
    }

    /**
     * Gets recent notification logs.
     */
    static async getRecentLogs(limit: number = 10, tenantId?: string): Promise<Notification[]> {
        try {
            const session = tenantId ? { user: { tenantId, role: 'ADMIN' } } : null;
            const collection = await getTenantCollection(this.COLLECTION, session as any, 'LOGS');

            const query = tenantId ? { tenantId } : {};

            const docs = await collection.find(query, {
                sort: { createdAt: -1 },
                limit: limit
            });
            return z.array(NotificationSchema).parse(docs);
        } catch (error: unknown) {
            console.error('[NotificationService] Error fetching recent logs:', error);
            return [];
        }
    }

    /**
     * Gets all notification templates.
     */
    static async getTemplates(): Promise<NotificationTemplate[]> {
        try {
            const collection = await getTenantCollection(this.TEMPLATES_COLLECTION, null, 'LOGS');
            const docs = await collection.find({}, { sort: { type: 1 } });
            return z.array(NotificationTemplateSchema).parse(docs);
        } catch (error: unknown) {
            console.error('[NotificationService] Error fetching templates:', error);
            return [];
        }
    }

    /**
     * Gets a specific notification template by type.
     */
    static async getTemplateByType(type: string): Promise<NotificationTemplate | null> {
        try {
            const collection = await getTenantCollection(this.TEMPLATES_COLLECTION, null, 'LOGS');
            const doc = await collection.findOne({ type });
            return doc ? NotificationTemplateSchema.parse(doc) : null;
        } catch (error: unknown) {
            console.error(`[NotificationService] Error fetching template ${type}:`, error);
            return null;
        }
    }

    // --- In-App API (MAIN Cluster via Repository) ---

    static async listUnread(userId: string, tenantId: string, limit = 20) {
        return await NotificationRepository.listUnread(userId, tenantId, limit);
    }

    static async markAsRead(notificationIds: string[], tenantId: string) {
        await NotificationRepository.markAsRead(notificationIds, tenantId);
    }
}

