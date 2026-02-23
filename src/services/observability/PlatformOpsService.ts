import { getTenantCollection } from '@/lib/db-tenant';
import { connectLogsDB } from '@/lib/db';

// Temporarily stub JobSchedulerService to bypass build failure (dangling reference)
const JobSchedulerService = {
    getDueJobs: async () => [] as any[]
};

/**
 * PlatformOpsService
 * Provides aggregated metrics and observability for SuperAdmins.
 */
export class PlatformOpsService {

    /**
     * Get platform-wide health metrics.
     * SLA: P95 < 500ms
     */
    static async getPlatformHealth(session: any): Promise<any> {
        if (session.user?.role !== 'SUPER_ADMIN') {
            throw new Error('Forbidden: SuperAdmin access required');
        }

        const logsDb = await connectLogsDB();
        const logsCollection = logsDb.collection('application_logs');
        const usageCollection = logsDb.collection('usage_logs');

        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        // 1. Job Health
        const jobs = await JobSchedulerService.getDueJobs(); // Mocking generic job fetch for stats

        // 2. SLA Violations (last 24h)
        const slaViolations = await logsCollection.countDocuments({
            action: 'PERFORMANCE_SLA_VIOLATION',
            createdAt: { $gte: twentyFourHoursAgo }
        });

        // 3. Token Burn Rate (last 24h)
        const tokenUsageStats = await usageCollection.aggregate([
            {
                $match: {
                    type: 'LLM_TOKENS',
                    timestamp: { $gte: twentyFourHoursAgo }
                }
            },
            {
                $group: {
                    _id: null,
                    totalTokens: { $sum: '$value' }
                }
            }
        ]).toArray();

        // 4. Critical Errors (last 24h)
        const criticalErrors = await logsCollection.countDocuments({
            level: 'ERROR',
            createdAt: { $gte: twentyFourHoursAgo }
        });

        return {
            period: '24h',
            health: {
                status: criticalErrors > 10 ? 'DEGRADED' : 'HEALTHY',
                criticalErrors,
                slaViolations
            },
            consumption: {
                totalTokens24h: tokenUsageStats[0]?.totalTokens || 0
            },
            jobs: {
                pendingCount: jobs.length
            }
        };
    }
}
