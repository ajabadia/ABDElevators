import { ObservabilityRepository } from './ObservabilityRepository';

/**
 * 📊 ObservabilityService
 * Business logic for platform metrics and system health.
 */
export class ObservabilityService {

    /**
     * Returns top consuming tenants and general AI usage.
     */
    static async getAITelemetry(days: number = 7) {
        const usage = await ObservabilityRepository.getUsageMetrics(days);
        const health = await ObservabilityRepository.getLlmHealth(days);

        const totalTokens = usage.reduce((acc: number, curr: any) => acc + (curr.totalTokens || 0), 0);
        const avgLatency = usage.length > 0
            ? usage.reduce((acc: number, curr: any) => acc + (curr.avgLatency || 0), 0) / usage.length
            : 0;

        const successCount = health.find((h: any) => h._id === 'PROMPT_RUNNER_SUCCESS')?.count || 0;
        const failureCount = health.find((h: any) => h._id === 'PROMPT_RUNNER_FAILURE')?.count || 0;
        const totalRequests = successCount + failureCount;

        return {
            summary: {
                totalTokens,
                avgLatency: Math.round(avgLatency),
                successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 100,
                totalRequests
            },
            tenants: usage.map((u: any) => ({
                id: u._id,
                tokens: u.totalTokens,
                avgLatency: Math.round(u.avgLatency),
                requests: u.requests
            })),
            health: {
                success: successCount,
                failure: failureCount
            }
        };
    }
}
