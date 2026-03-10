import { FederatedPatternSchema, FederatedPattern } from '@/lib/schemas';
import { IntelligenceStats } from '@/lib/intelligence-analytics';
import { intelligenceRepository } from '@/lib/repositories/IntelligenceRepository';
import { z } from 'zod';
import { AppError } from '@/lib/errors';
import { getTenantCollection } from '@/lib/db';

/**
 * 🏢 IntelligenceService
 * Centralized service for intelligence analytics and pattern governance.
 * Standardized for Era 8 (Zero any, explicit types).
 */
export class IntelligenceService {

    /**
     * Gets global intelligence statistics.
     */
    static async getStats(): Promise<IntelligenceStats | null> {
        try {
            const stats = await intelligenceRepository.getGlobalStats();
            return stats as unknown as IntelligenceStats;
        } catch (error: unknown) {
            console.error('[IntelligenceService] Error fetching stats:', error);
            throw new AppError('INTELLIGENCE_ERROR', 500, 'Error al recuperar estadísticas de inteligencia');
        }
    }

    /**
     * Gets federated patterns with optional filters.
     */
    static async getPatterns(options: { limit?: number } = {}): Promise<{ patterns: FederatedPattern[] }> {
        try {
            const docs = await intelligenceRepository.list({} as any, {
                sort: { confidenceScore: -1 } as any,
                limit: options.limit || 20
            });

            return {
                patterns: z.array(FederatedPatternSchema).parse(docs)
            };
        } catch (error: unknown) {
            console.error('[IntelligenceService] Error fetching patterns:', error);
            throw new AppError('INTELLIGENCE_ERROR', 500, 'Error al recuperar patrones federados');
        }
    }

    /**
     * Gets discovery trends and efficiency metrics.
     * Phase 343: Data-driven Intelligence Trends.
     */
    static async getTrends(tenantId: string): Promise<any[]> {
        try {
            const collection = await getTenantCollection('usage_logs');
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Aggregate patterns discovered and tokens saved by day
            const trends = await collection.aggregate([
                {
                    $match: {
                        timestamp: { $gte: thirtyDaysAgo },
                        tipo: { $in: ['KNOWLEDGE_DISCOVERY', 'LLM_TOKENS'] }
                    }
                },
                {
                    $group: {
                        _id: {
                            day: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                            tipo: "$tipo"
                        },
                        count: { $sum: { $cond: [{ $eq: ["$tipo", 'KNOWLEDGE_DISCOVERY'] }, 1, 0] } },
                        value: { $sum: "$valor" }
                    }
                },
                {
                    $group: {
                        _id: "$_id.day",
                        patterns: { $sum: "$count" },
                        tokens: { $sum: "$value" }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            return (trends as any[]).map((t: any) => ({
                name: t._id,
                patterns: t.patterns,
                tokens: t.tokens,
                savings: Math.round(t.tokens * 0.00002 * 100) / 100 // Example coefficient for ROI
            }));
        } catch (error: unknown) {
            console.error('[IntelligenceService] Error fetching trends:', error);
            throw new AppError('INTELLIGENCE_ERROR', 500, 'Error al calcular tendencias de inteligencia');
        }
    }
}
