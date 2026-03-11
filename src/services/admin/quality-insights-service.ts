import { z } from 'zod';
import { AppError } from '@/lib/errors';
import { ragEvaluationRepository } from '@/lib/repositories/RagEvaluationRepository';
import { EntityIdSchema, TenantIdSchema } from '@abd/platform-core';
import { UserRole } from '@/types/roles';
import { type TenantSession } from '@/lib/db-tenant';

/**
 * 📊 Zod Schema for Quality Insights Request
 */
export const QualityInsightsQuerySchema = z.object({
    tenantId: z.string(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    industry: z.string().optional(),
});

export type QualityInsightsQuery = z.infer<typeof QualityInsightsQuerySchema>;

export interface OperatorMetric {
    operatorId: string;
    avgFaithfulness: number;
    totalQueries: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ManualMetric {
    assetId: string;
    assetName: string;
    avgRelevance: number;
    queriesCount: number;
}

/**
 * 🚀 QualityInsightsService
 * Phase 308: Product-centric insights for RAG Suite.
 */
export class QualityInsightsService {
    /**
     * Get aggregated RAG quality metrics per tenant.
     */
    static async getGlobalQuality(query: QualityInsightsQuery) {
        const validated = QualityInsightsQuerySchema.parse(query);
        const tId = TenantIdSchema.parse(validated.tenantId);
        const session: TenantSession = {
            user: {
                id: EntityIdSchema.parse('000000000000000000000000'),
                tenantId: tId,
                role: UserRole.SUPER_ADMIN
            }
        };

        const dateFilter: any = {};
        if (validated.startDate || validated.endDate) {
            dateFilter.timestamp = {};
            if (validated.startDate) dateFilter.timestamp.$gte = validated.startDate;
            if (validated.endDate) dateFilter.timestamp.$lte = validated.endDate;
        }

        const stats = await ragEvaluationRepository.aggregate([
            { $match: { ...dateFilter } as any },
            {
                $group: {
                    _id: null,
                    avgFaithfulness: { $avg: '$metrics.faithfulness' },
                    avgRelevance: { $avg: '$metrics.answer_relevance' },
                    avgPrecision: { $avg: '$metrics.context_precision' },
                    totalEvaluations: { $sum: 1 },
                    hallucinationCount: {
                        $sum: { $cond: [{ $lt: ['$metrics.faithfulness', 0.6] }, 1, 0] } as any
                    }
                } as any
            }
        ], session);

        return stats[0] || {
            avgFaithfulness: 0,
            avgRelevance: 0,
            avgPrecision: 0,
            totalEvaluations: 0,
            hallucinationCount: 0
        };
    }

    /**
     * Get metrics by manual/document version.
     */
    static async getManualInsights(tenantId: string): Promise<ManualMetric[]> {
        const tId = TenantIdSchema.parse(tenantId);
        const session: TenantSession = {
            user: {
                id: EntityIdSchema.parse('000000000000000000000000'),
                tenantId: tId,
                role: UserRole.SUPER_ADMIN
            }
        };

        return await ragEvaluationRepository.aggregate([
            {
                $group: {
                    _id: '$assetId',
                    assetName: { $first: '$assetName' },
                    avgRelevance: { $avg: '$metrics.answer_relevance' },
                    queriesCount: { $sum: 1 }
                } as any
            },
            { $sort: { avgRelevance: 1 } as any },
            { $limit: 10 }
        ], session) as unknown as ManualMetric[];
    }

    /**
     * Phase 310: Analytical comparison between Engine Versions (v1 vs v2).
     */
    static async getVersionComparison(tenantId: string) {
        const tId = TenantIdSchema.parse(tenantId);
        const session: TenantSession = {
            user: {
                id: EntityIdSchema.parse('000000000000000000000000'),
                tenantId: tId,
                role: UserRole.SUPER_ADMIN
            }
        };

        return await ragEvaluationRepository.aggregate([
            {
                $group: {
                    _id: '$engineVersion',
                    avgFaithfulness: { $avg: '$metrics.faithfulness' },
                    avgRelevance: { $avg: '$metrics.answer_relevance' },
                    avgPrecision: { $avg: '$metrics.context_precision' },
                    count: { $sum: 1 }
                } as any
            }
        ], session);
    }

    /**
     * Phase 310: Analysis by Flow Type (e.g., TECHNICAL_CHAT vs ENTITY_ANALYSIS).
     */
    static async getFlowAnalysis(tenantId: string) {
        const tId = TenantIdSchema.parse(tenantId);
        const session: TenantSession = {
            user: {
                id: EntityIdSchema.parse('000000000000000000000000'),
                tenantId: tId,
                role: UserRole.SUPER_ADMIN
            }
        };

        return await ragEvaluationRepository.aggregate([
            {
                $group: {
                    _id: '$flowType',
                    avgFaithfulness: { $avg: '$metrics.faithfulness' },
                    avgRelevance: { $avg: '$metrics.answer_relevance' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ], session);
    }
}
