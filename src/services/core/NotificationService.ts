import { NotificationTemplateService } from '../infra/email/notification-template-service';
import { NotificationEmailSender } from '../infra/email/notification-email-sender';
import { notificationRepository } from './notifications/NotificationRepository';
import { NotificationConfigService } from './notifications/NotificationConfigService';
import { getTenantCollection } from '@/lib/db-tenant';
import { Notification, NotificationSchema, NotificationTemplate, NotificationTemplateSchema } from '@/lib/schemas/notifications';
import { EntityId, TenantId, TenantIdSchema } from '@/lib/schemas/common';
import { z } from 'zod';
import { ValidationError } from '@abd/platform-core';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { getSystemSession } from '@/lib/sessions/system-session';
import { TenantSession } from '@/lib/db-tenant';

export interface NotificationPayload {
    tenantId: string;
    userId?: string; // 🚀 ERA 12: Mandatory for In-App, optional for direct Email only
    type: string; // Relaxed for custom types like INVITE
    level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, unknown>;
    language?: string;
    extraRecipients?: string[]; // Support for bulk/external emails
}

/**
 * NotificationService
 * Orchestrator for the notification sub-system.
 * Hardened Era 12: Mandatory User Linkage & No direct email recipients.
 */
export class NotificationService {
    private static COLLECTION = 'notifications';
    private static TEMPLATES_COLLECTION = 'notification_templates';

    /**
     * Core notification orchestration. (MAIN Cluster via Repository)
     */
    static async notify(payload: NotificationPayload): Promise<void> {
        const { tenantId, type, userId, language = 'es', extraRecipients = [] } = payload;

        return withCorrelation({ level: 'INFO', source: 'NOTIFICATION_SERVICE', action: 'NOTIFY', tenantId: tenantId as TenantId }, async ({ log, correlationId }) => {
            try {
                const config = await NotificationConfigService.getTenantConfig(tenantId);
                let eventConfig = ((config.events || {}) as Record<string, { enabled?: boolean, channels?: string[], customNote?: string }>)[type] || {
                    enabled: true,
                    channels: ['EMAIL', 'IN_APP']
                };

                if (eventConfig.enabled === false) return;

                const systemSession = getSystemSession(tenantId as TenantId);

                // 1. Process Internal Recipient (User-linked)
                if (userId) {
                    const userPrefs = await NotificationConfigService.getUserPreferences(userId, tenantId, type);
                    const userEmail = await NotificationConfigService.getUserEmail(userId, tenantId);

                    if (!userEmail && eventConfig.channels?.includes('EMAIL')) {
                        await log({ message: `User ${userId} has no email defined. Email delivery skipped.`, level: 'WARN' });
                    }

                    // Persist In-App
                    let notifId: string | null = null;
                    if (userPrefs.inApp) {
                        notifId = await notificationRepository.create(
                            { ...payload, userId: userId as EntityId },
                            systemSession
                        );
                    }

                    // Internal Email delivery
                    if (eventConfig.channels && eventConfig.channels.includes('EMAIL') && userEmail && userPrefs.email) {
                        await this.deliverEmail(payload, [userEmail], eventConfig.customNote, language);
                        if (notifId) await notificationRepository.markAsSent(notifId, tenantId, userEmail, systemSession);
                    }
                }

                // 2. Process Extra Recipients (External)
                if (extraRecipients.length > 0 && eventConfig.channels?.includes('EMAIL')) {
                    await this.deliverEmail(payload, extraRecipients, eventConfig.customNote, language);
                }

            } catch (error: unknown) {
                await log({ message: 'Error in notify orchestration', level: 'ERROR', details: { error: String(error) } });
                if (error instanceof ValidationError) throw error;
            }
        });
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
    static async getStats(tenantId?: TenantId): Promise<{ totalSent: number, totalErrors: number, totalBilling: number }> {
        return withCorrelation({ level: 'INFO', source: 'NOTIFICATION_SERVICE', action: 'GET_STATS', tenantId }, async ({ log }) => {
            try {
                const systemSession = tenantId ? getSystemSession(tenantId) : null;
                const collection = await getTenantCollection(this.COLLECTION, systemSession);

                const query = tenantId ? { tenantId } : {};

                const [totalSent, totalErrors, totalBilling] = await Promise.all([
                    collection.countDocuments({ ...query, emailSent: true }),
                    collection.countDocuments({ ...query, level: 'ERROR' }),
                    collection.countDocuments({ ...query, type: 'BILLING_EVENT' })
                ]);

                return { totalSent, totalErrors, totalBilling };
            } catch (error: unknown) {
                await log({ message: 'Error fetching stats', level: 'ERROR', details: { error: String(error) } });
                return { totalSent: 0, totalErrors: 0, totalBilling: 0 };
            }
        });
    }

    /**
     * Gets recent notification logs.
     */
    static async getRecentLogs(limit: number = 10, tenantId?: TenantId): Promise<Notification[]> {
        return withCorrelation({ level: 'INFO', source: 'NOTIFICATION_SERVICE', action: 'GET_RECENT_LOGS', tenantId }, async ({ log }) => {
            try {
                const systemSession = tenantId ? getSystemSession(tenantId) : null;
                const collection = await getTenantCollection(this.COLLECTION, systemSession);

                const query = tenantId ? { tenantId } : {};

                const docs = await collection.find(query, {
                    sort: { createdAt: -1 },
                    limit: limit
                });
                return z.array(NotificationSchema).parse(docs);
            } catch (error: unknown) {
                await log({ message: 'Error fetching recent logs', level: 'ERROR', details: { error: String(error) } });
                return [];
            }
        });
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

    static async listUnread(userId: string, tenantId: string, limit = 20, session?: TenantSession) {
        return await notificationRepository.listUnread(userId, tenantId, limit, session);
    }

    static async markAsRead(notificationIds: string[], tenantId: string, session?: TenantSession) {
        await notificationRepository.markAsRead(notificationIds, tenantId, session);
    }
}

