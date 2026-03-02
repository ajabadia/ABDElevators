import { getTenantCollection } from '@/lib/db-tenant';
import { Notification, NotificationSchema, NotificationTemplate, NotificationTemplateSchema } from '@/lib/schemas/notifications';
import { z } from 'zod';

/**
 * NotificationService handles system notification logs and management.
 */
export class NotificationService {
    private static COLLECTION = 'notifications';
    private static TEMPLATES_COLLECTION = 'notification_templates';

    /**
     * Gets notification statistics for the dashboard.
     */
    static async getStats(): Promise<{ totalSent: number, totalErrors: number, totalBilling: number }> {
        try {
            const collection = await getTenantCollection(this.COLLECTION, null, 'LOGS');

            const [totalSent, totalErrors, totalBilling] = await Promise.all([
                collection.countDocuments({ emailSent: true }),
                collection.countDocuments({ level: 'ERROR' }),
                collection.countDocuments({ type: 'BILLING_EVENT' })
            ]);

            return {
                totalSent,
                totalErrors,
                totalBilling
            };
        } catch (error: unknown) {
            console.error('[NotificationService] Error fetching stats:', error);
            return { totalSent: 0, totalErrors: 0, totalBilling: 0 };
        }
    }

    /**
     * Gets recent notification logs.
     */
    static async getRecentLogs(limit: number = 10): Promise<Notification[]> {
        try {
            const collection = await getTenantCollection(this.COLLECTION, null, 'LOGS');

            const docs = await collection.find({}, {
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
}
