import { getTenantCollection } from "@/lib/db-tenant";
import { ObjectId } from 'mongodb';
import { NotificationPayload } from '../NotificationService';

/**
 * NotificationRepository
 * Handles persistence and database operations for notifications.
 */
export class NotificationRepository {
    static async create(payload: NotificationPayload, mainRecipient?: string): Promise<string> {
        const session = { user: { id: 'system', tenantId: payload.tenantId, role: 'SYSTEM' } } as any;
        const collection = await getTenantCollection('notifications', session);

        const res = await collection.insertOne({
            ...payload,
            emailRecipient: mainRecipient,
            read: false,
            archived: false,
            createdAt: new Date()
        });
        return res.insertedId.toString();
    }

    static async markAsSent(notifId: string, tenantId: string, recipient: string): Promise<void> {
        const session = { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any;
        const collection = await getTenantCollection('notifications', session);
        await collection.updateOne(
            { _id: new ObjectId(notifId) },
            { $set: { emailSent: true, emailSentAt: new Date(), emailRecipient: recipient } }
        );
    }

    static async listUnread(userId: string, tenantId: string, limit = 20) {
        const session = { user: { id: userId, tenantId, role: 'USER' } } as any;
        const collection = await getTenantCollection('notifications', session);
        return await collection.find({ userId, read: false, archived: false }, { sort: { createdAt: -1 }, limit } as any);
    }

    static async markAsRead(notificationIds: string[], tenantId: string): Promise<void> {
        if (!notificationIds.length) return;
        const session = { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any;
        const collection = await getTenantCollection('notifications', session);
        await collection.updateMany(
            { _id: { $in: notificationIds.map(id => new ObjectId(id)) } },
            { $set: { read: true, readAt: new Date() } }
        );
    }
}
