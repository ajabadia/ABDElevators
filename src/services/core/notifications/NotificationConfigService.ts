import { getTenantCollection } from "@/lib/db-tenant";
import { ObjectId } from 'mongodb';

const configCache = new Map<string, { config: any, expires: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

/**
 * NotificationConfigService
 * Handles fetching notification configurations and user preferences.
 */
export class NotificationConfigService {
    static async getTenantConfig(tenantId: string): Promise<any> {
        const cached = configCache.get(tenantId);
        if (cached && cached.expires > Date.now()) return cached.config;

        const session = { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any;
        const collection = await getTenantCollection('notification_configs', session);
        const config = await collection.findOne({ tenantId });

        const finalConfig = config || { tenantId, events: {}, fallbackEmail: null };
        configCache.set(tenantId, { config: finalConfig, expires: Date.now() + CACHE_TTL });
        return finalConfig;
    }

    static async getUserPreferences(userId: string, tenantId: string, type: string) {
        const session = { user: { id: userId, tenantId, role: 'USER' } } as any;
        const collection = await getTenantCollection('users', session);
        const user = await collection.findOne({ _id: new ObjectId(userId) });

        if (!user || !user.notificationPreferences) return { email: true, inApp: true };
        const pref = user.notificationPreferences.find((p: any) => p.type === type);
        return {
            email: pref ? pref.email !== false : true,
            inApp: pref ? pref.inApp !== false : true
        };
    }

    static async getUserEmail(userId: string, tenantId: string) {
        const session = { user: { id: userId, tenantId, role: 'USER' } } as any;
        const collection = await getTenantCollection('users', session);
        const user = await collection.findOne({ _id: new ObjectId(userId) });
        return user?.email || null;
    }

    static async getSystemTemplate(type: string, tenantId: string) {
        const session = { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any;
        const collection = await getTenantCollection('notification_templates', session);
        return await collection.findOne({ type, active: true });
    }
}
