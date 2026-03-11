import { NotificationTemplateService } from '../infra/email/notification-template-service';
import { NotificationEmailSender } from '../infra/email/notification-email-sender';
import { notificationRepository } from './notifications/NotificationRepository';
import { NotificationConfigService } from './notifications/NotificationConfigService';
import { getTenantCollection } from '@/lib/db-tenant';
import { Notification, NotificationSchema, NotificationTemplate, NotificationTemplateSchema } from '@/lib/schemas/notifications';
import { EntityId } from '@/lib/schemas/common';
import { z } from 'zod';

import { ValidationError } from '@abd/platform-core';

export interface NotificationPayload {
    tenantId: string;
    userId: string; // 🚀 ERA 12: Mandatory
    type: 'SYSTEM' | 'ANALYSIS_COMPLETE' | 'RISK_ALERT' | 'BILLING_EVENT' | 'SECURITY_ALERT';
    level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, unknown>;
    language?: string;
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
        const { tenantId, type, userId, language = 'es' } = payload;

        if (!userId) {
            throw new ValidationError('NOTIFICATION_ERROR', 'userId is mandatory for all notifications (Era 12 Hardening)');
        }

        try {
            const config = await NotificationConfigService.getTenantConfig(tenantId);
            let eventConfig = ((config.events || {}) as Record<string, { enabled?: boolean, channels?: string[], customNote?: string }>)[type] || {
                enabled: true,
                channels: ['EMAIL', 'IN_APP']
            };

            if (eventConfig.enabled === false) return;

            // Determine user preferences and email
            const userPrefs = await NotificationConfigService.getUserPreferences(userId, tenantId, type);
            const userEmail = await NotificationConfigService.getUserEmail(userId, tenantId);

            if (!userEmail && eventConfig.channels?.includes('EMAIL')) {
                console.warn(`[NotificationService] User ${userId} has no email defined. Email delivery skipped.`);
            }

            // Persist In-App
            let notifId: string | null = null;
            if (userPrefs.inApp) {
                // Modified Repository call to pass userId explicitly
                notifId = await notificationRepository.create({ ...payload, userId: userId as EntityId }, { user: { tenantId, id: 'system', role: 'SYSTEM' } } as any);
            }

            // Process Channels
            if (eventConfig.channels && eventConfig.channels.includes('EMAIL') && userEmail && userPrefs.email) {
                await this.deliverEmail(payload, [userEmail], eventConfig.customNote, language);
                if (notifId) await notificationRepository.markAsSent(notifId, tenantId, userEmail);
            }

        } catch (error: unknown) {
            console.error('[NotificationService] Error:', error);
            if (error instanceof ValidationError) throw error;
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
        return await notificationRepository.listUnread(userId, tenantId, limit);
    }

    static async markAsRead(notificationIds: string[], tenantId: string) {
        await notificationRepository.markAsRead(notificationIds, tenantId);
    }
}

