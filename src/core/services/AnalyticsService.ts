import { connectDB, connectLogsDB } from '@/lib/db';
import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { UsageService } from '@/services/ops/usage-service';

export class AnalyticsService {
    /**
     * Retrieves a daily breakdown of token usage for the last 30 days.
     */
    static async getDailyTokenUsage(tenantId: string): Promise<{ date: string; tokens: number }[]> {
        try {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 30);

            const collection = await getTenantCollection('usage_logs');

            // Aggregation pipeline
            const pipeline = [
                {
                    $match: {
                        tenantId,
                        type: 'LLM_TOKENS',
                        timestamp: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                        totalTokens: { $sum: "$value" }
                    }
                },
                { $sort: { _id: 1 } }
            ];

            const results = await collection.aggregate(pipeline);

            return results.map((r: any) => ({
                date: r._id,
                tokens: r.totalTokens
            }));
        } catch (error) {
            await logEvento({
                level: 'ERROR',
                source: 'ANALYTICS_SERVICE',
                action: 'ERROR',
                message: 'Error fetching daily token usage',
                correlationId: 'SYSTEM',
                tenantId,
                details: { error: (error as Error).message }
            });
            return [];
        }
    }

    /**
     * Retrieves average RAG precision and faithfulness metrics.
     */
    static async getRAGPerformance(tenantId: string): Promise<{ precision: number; samples: number }> {
        try {
            const collection = await getTenantCollection('usage_logs');
            const pipeline = [
                {
                    $match: {
                        tenantId,
                        type: 'RAG_PRECISION'
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgPrecision: { $avg: "$value" },
                        count: { $sum: 1 }
                    }
                }
            ];

            const result = await collection.aggregate(pipeline);
            return {
                precision: result[0]?.avgPrecision || 0,
                samples: result[0]?.count || 0
            };
        } catch (error) {
            console.error('Error fetching RAG performance', error);
            return { precision: 0, samples: 0 };
        }
    }

    /**
     * Calculates system health based on error rate in the last 24 hours.
     * Returns a score from 0 (Critical) to 100 (Healthy).
     */
    static async getSystemHealth(tenantId: string): Promise<{ score: number; errorCount: number }> {
        try {
            const db = await connectLogsDB();
            const collection = db.collection('application_logs');

            const yesterday = new Date();
            yesterday.setHours(yesterday.getHours() - 24);

            // Count errors
            const errorCount = await collection.countDocuments({
                tenantId: tenantId, // Assuming application_logs has tenantId (checked logEvento)
                level: 'ERROR',
                timestamp: { $gte: yesterday }
            });

            // Count total operations (approximate via INFO logs or Usage logs)
            // Ideally we compare errors vs total requests, but for now simple threshold
            // < 5 errors = 100%
            // > 50 errors = 0%

            let score = 100;
            if (errorCount > 50) score = 0;
            else if (errorCount > 0) score = Math.max(0, 100 - (errorCount * 2));

            return { score, errorCount };
        } catch (error) {
            console.error('Error calculating system health', error);
            return { score: 100, errorCount: 0 }; // Fail open
        }
    }
}
