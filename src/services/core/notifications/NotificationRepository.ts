import { BaseRepository } from "@/lib/repositories/BaseRepository";
import { Notification, NotificationSchema } from "@/lib/schemas/notifications";
import { ObjectId, type ClientSession } from 'mongodb';
import { type TenantSession } from "@/lib/db-tenant";
import { EntityId } from "@/lib/schemas/common";

/**
 * 🏛️ NotificationRepository
 * Handles persistence and database operations for notifications.
 * Refactored for Era 12 (Hardened relational integrity via BaseRepository).
 */
export class NotificationRepository extends BaseRepository<Notification> {
    constructor() {
        super('notifications', 'LOGS'); // Notifications go to LOGS cluster
    }

    /**
     * Creates a new notification with user existence validation.
     */
    async create(
        payload: any,
        session?: TenantSession | null,
        mongoSession?: ClientSession
    ): Promise<EntityId> {
        // 1. Relational Hardening: Validate user exists in the tenant
        if (payload.userId) {
            await this.validateExists('users', payload.userId as EntityId, session, mongoSession);
        }

        const data = {
            ...payload,
            updatedAt: new Date()
        };

        const validated = NotificationSchema.parse(data);
        return await super.create(validated as any, session, mongoSession);
    }

    async markAsSent(notifId: string, tenantId: string, recipient: string, session?: TenantSession): Promise<void> {
        await this.update(
            notifId,
            { $set: { emailSent: true, emailSentAt: new Date(), emailRecipient: recipient } } as any,
            session
        );
    }

    async listUnread(userId: string, tenantId: string, limit = 20, session?: TenantSession) {
        return await this.list(
            { userId, read: false, archived: false } as any,
            { limit, sort: { createdAt: -1 } },
            session
        );
    }

    async markAsRead(notificationIds: string[], tenantId: string, session?: TenantSession): Promise<void> {
        if (!notificationIds.length) return;
        const collection = await this.getCollection(session);
        await collection.updateMany(
            { _id: { $in: notificationIds.map(id => this.toObjectId(id)) } } as any,
            { $set: { read: true, readAt: new Date() } } as any,
            { session: (session as any)?.client } as any
        );
    }
}

export const notificationRepository = new NotificationRepository();
