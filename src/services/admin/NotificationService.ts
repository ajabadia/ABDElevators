import { getTenantCollection } from '@/lib/db-tenant';

/**
 * NotificationService handles system notification logs and management.
 */
export class NotificationService {
    private static COLLECTION = 'notifications';

    /**
     * Gets notification statistics for the dashboard.
     */
    static async getStats() {
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
        } catch (error) {
            console.error('[NotificationService] Error fetching stats:', error);
            return { totalSent: 0, totalErrors: 0, totalBilling: 0 };
        }
    }

    /**
     * Gets recent notification logs.
     */
    static async getRecentLogs(limit: number = 10) {
        try {
            const collection = await getTenantCollection(this.COLLECTION, null, 'LOGS');

            return await (collection as any).find({}, {
                sort: { createdAt: -1 },
                limit: limit
            });
        } catch (error) {
            console.error('[NotificationService] Error fetching recent logs:', error);
            return [];
        }
    }
}
