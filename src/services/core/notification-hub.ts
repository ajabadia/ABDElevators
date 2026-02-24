import { Document } from 'mongodb';
import { getTenantCollection, TenantSession } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import {
    Notification,
    NotificationSchema,
    NotificationType
} from '@/lib/schemas/notifications';
import { EmailService } from '@/services/infra/EmailService';

/**
 * NotificationHub
 * Unified dispatch center for all platform communications.
 */
export class NotificationHub {

    /**
     * Send a notification to a specific user or tenant.
     * Automatically handles In-App persistence and Email delivery.
     */
    static async notify(session: TenantSession, params: {
        toUserId?: string;
        type: NotificationType;
        level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
        title: string;
        message: string;
        link?: string;
        channels?: ('IN_APP' | 'EMAIL')[];
        metadata?: Record<string, any>;
    }): Promise<void> {
        const { toUserId, type, level, title, message, link, channels = ['IN_APP'], metadata } = params;
        const tenantId = session.user?.tenantId || 'platform_master';
        const correlationId = `notif-${Date.now()}`;

        // 1. In-App Notification (Persistence)
        if (channels.includes('IN_APP')) {
            const collection = await getTenantCollection<Document>('notifications', session, 'LOGS');
            const notification: Notification = {
                tenantId,
                userId: toUserId,
                type,
                level,
                title,
                message,
                link,
                read: false,
                archived: false,
                createdAt: new Date(),
                metadata
            } as any;

            await collection.insertOne(notification as any);
        }

        // 2. Email Notification (Delivery)
        if (channels.includes('EMAIL')) {
            // Logic to determine which template to use based on type
            // For now, we manually handle known types or log a generic delivery
            try {
                if (type === 'SECURITY_ALERT' && metadata?.mfaEnabled) {
                    await EmailService.sendMfaEnabledEmail({
                        to: metadata.email,
                        userName: metadata.userName || 'Usuario'
                    });
                }
                // Add more template mappings as needed
            } catch (error) {
                console.error(`[NOTIFICATION_HUB] Email delivery failed for ${type}:`, error);
            }
        }

        await logEvento({
            level: 'INFO',
            source: 'NOTIFICATION_HUB',
            action: 'NOTIFICATION_SENT',
            message: `Notification sent: ${title} (${type})`,
            tenantId,
            correlationId,
            details: { toUserId, type, channels }
        });
    }

    /**
     * Mark a notification as read.
     */
    static async markAsRead(session: TenantSession, notificationId: string): Promise<void> {
        const collection = await getTenantCollection<Document>('notifications', session, 'LOGS');
        const { ObjectId } = await import('mongodb');

        await collection.updateOne(
            { _id: new ObjectId(notificationId) },
            { $set: { read: true, readAt: new Date() } }
        );
    }
}
