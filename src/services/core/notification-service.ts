import { NotificationTemplateService } from '../infra/email/notification-template-service';
import { NotificationEmailSender } from '../infra/email/notification-email-sender';
import { NotificationRepository } from './notifications/NotificationRepository';
import { NotificationConfigService } from './notifications/NotificationConfigService';

export interface NotificationPayload {
    tenantId: string;
    userId?: string;
    type: 'SYSTEM' | 'ANALYSIS_COMPLETE' | 'RISK_ALERT' | 'BILLING_EVENT' | 'SECURITY_ALERT';
    level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, any>;
    language?: string;
    extraRecipients?: string[];
}

/**
 * NotificationService
 * Orchestrator for the notification sub-system.
 * Refactored Phase 8.3: Delegating logic to specialized repository and config services.
 */
export class NotificationService {

    /**
     * Core notification orchestration.
     */
    static async notify(payload: NotificationPayload): Promise<void> {
        const { tenantId, type, userId, language = 'es', extraRecipients = [] } = payload;

        try {
            const config = await NotificationConfigService.getTenantConfig(tenantId);
            let eventConfig = config.events?.[type] || {
                enabled: true,
                channels: ['EMAIL', 'IN_APP'],
                recipients: []
            };

            if (eventConfig.enabled === false) return;

            // Determine recipients
            let recipientsSet: Set<string> = new Set();
            let userPrefs = userId ? await NotificationConfigService.getUserPreferences(userId, tenantId, type) : { email: true, inApp: true };

            if (eventConfig.recipients?.length > 0) {
                eventConfig.recipients.forEach((r: string) => recipientsSet.add(r));
            }

            if (userId && userPrefs.email) {
                const userEmail = await NotificationConfigService.getUserEmail(userId, tenantId);
                if (userEmail) recipientsSet.add(userEmail);
            }

            if (recipientsSet.size === 0 && !userId && config.fallbackEmail) {
                recipientsSet.add(config.fallbackEmail);
            }

            extraRecipients.forEach(r => recipientsSet.add(r));
            const recipients = Array.from(recipientsSet);

            // Persist In-App
            let notifId: string | null = null;
            if (userPrefs.inApp || !userId) {
                notifId = await NotificationRepository.create(payload, recipients[0]);
            }

            // Process Channels
            if (eventConfig.channels.includes('EMAIL') && recipients.length > 0) {
                await this.deliverEmail(payload, recipients, eventConfig.customNote, language);
                if (notifId) await NotificationRepository.markAsSent(notifId, tenantId, recipients[0]);
            }

        } catch (error: any) {
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

    // --- Public API ---
    static async listUnread(userId: string, tenantId: string, limit = 20) {
        return await NotificationRepository.listUnread(userId, tenantId, limit);
    }

    static async markAsRead(notificationIds: string[], tenantId: string) {
        await NotificationRepository.markAsRead(notificationIds, tenantId);
    }
}
