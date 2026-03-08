import { connectDB, connectAuthDB, connectLogsDB } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { ObjectId } from 'mongodb';

export interface RagQualityMetrics {
    avgFaithfulness: number;
    avgRelevance: number;
    avgPrecision: number;
}

export interface IndustryStat {
    _id: string;
    count: number;
}

export interface RecentTenant {
    _id: ObjectId;
    name: string;
    subscription: {
        tier: string;
    };
    createdAt: Date;
}

export interface GlobalStats {
    totalTenants: number;
    totalUsers: number;
    totalFiles: number;
    totalCases: number;
    mau: number;
    mrr: number;
    performance: {
        sla_violations_30d: number;
        errors_30d: number;
        rag_quality_avg: RagQualityMetrics | null;
    };
    usage: {
        tokens: number;
        storage: number;
        searches: number;
        savings: number;
    };
    industries: IndustryStat[];
    recent_tenants: RecentTenant[];
    infra: {
        region: string;
        cacheHitRate: string;
        ttlEnforcement: string;
    };
}

export interface HealthData {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    ingestSuccessRate: number;
    avgRagLatency: number;
    securityAnomaliesCount: number;
    activeUsers24h: number;
    activeProcessingCount: number;
    activeJobs: Array<{ id: string; name: string; status: string; updatedAt: string }>;
    ingestSlaScore: number;
    activeWorkers: number;
    dlqSize: number;
    analytics: {
        peakHour: string;
        peakConcurrency: number;
    };
    timestamp: string;
}

/**
 * 🚀 DashboardService
 * ERA 11: Optimized for Server Components and direct DB access.
 */
export class DashboardService {
    /**
     * Get global metrics (SuperAdmin scope)
     */
    static async getGlobalStats(): Promise<GlobalStats> {
        const [db, authDb, logsDb] = await Promise.all([
            connectDB(),
            connectAuthDB(),
            connectLogsDB()
        ]);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // BATCH 1: Auth & Basic counts (Fast)
        const [
            totalTenants,
            totalUsers,
            totalFiles,
            totalCases
        ] = await Promise.all([
            authDb.collection('tenants').countDocuments(),
            authDb.collection('users').countDocuments(),
            db.collection('knowledge_assets').estimatedDocumentCount(), // Phase 306: Optimization
            db.collection('pedidos').estimatedDocumentCount() // Phase 306: Optimization
        ]);

        // BATCH 2: Aggregations & Complex filters
        const [
            mau,
            mrrStats,
            usageStats,
            slaViolations,
            recentErrors
        ] = await Promise.all([
            db.collection('usage_logs').distinct('tenantId', {
                timestamp: { $gte: thirtyDaysAgo }
            }),
            authDb.collection('tenants').aggregate([
                { $match: { "subscription.status": { $in: ["ACTIVE", "active", "trialing"] } } },
                { $project: { tier: { $ifNull: ["$subscription.tier", "$subscription.plan"] } } },
                {
                    $group: {
                        _id: null,
                        totalMRR: {
                            $sum: {
                                $switch: {
                                    branches: [
                                        { case: { $eq: ["$tier", "PRO"] }, then: 99 },
                                        { case: { $eq: ["$tier", "ENTERPRISE"] }, then: 499 }
                                    ],
                                    default: 0
                                }
                            }
                        }
                    }
                }
            ]).toArray(),
            db.collection('usage_logs').aggregate([
                { $group: { _id: "$tipo", total: { $sum: "$valor" } } }
            ]).toArray(),
            logsDb.collection('application_logs').countDocuments({
                action: 'SLA_VIOLATION',
                timestamp: { $gte: thirtyDaysAgo }
            }),
            logsDb.collection('application_logs').countDocuments({
                level: 'ERROR',
                timestamp: { $gte: thirtyDaysAgo }
            })
        ]);

        // BATCH 3: UI specific projections
        const [
            industryStats,
            ragQuality,
            tenants
        ] = await Promise.all([
            authDb.collection('tenants').aggregate([
                { $group: { _id: "$industry", count: { $sum: 1 } } }
            ]).toArray(),
            db.collection('rag_evaluations').aggregate([
                { $sort: { timestamp: -1 } },
                { $limit: 100 },
                {
                    $group: {
                        _id: null,
                        avgFaithfulness: { $avg: "$faithfulness" },
                        avgRelevance: { $avg: "$answer_relevance" },
                        avgPrecision: { $avg: "$context_precision" }
                    }
                }
            ]).toArray(),
            authDb.collection('tenants')
                .find({}, { projection: { name: 1, 'subscription.tier': 1, createdAt: 1 } })
                .sort({ createdAt: -1 })
                .limit(5)
                .toArray()
        ]);

        const estimatedMRR = mrrStats[0]?.totalMRR || 0;

        // 🛡️ Sanitize MongoDB objects for Client Components (Server-side hydration)
        const sanitizedTenants = tenants.map(t => ({
            ...t,
            _id: t._id.toString(),
            createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt
        })) as unknown as RecentTenant[];

        return {
            totalTenants,
            totalUsers,
            totalFiles,
            totalCases,
            mau: mau.length,
            mrr: estimatedMRR,
            performance: {
                sla_violations_30d: slaViolations,
                errors_30d: recentErrors,
                rag_quality_avg: (ragQuality[0] as unknown as RagQualityMetrics) || null
            },
            usage: {
                tokens: usageStats.find(s => s._id === 'LLM_TOKENS')?.total || 0,
                storage: usageStats.find(s => s._id === 'STORAGE_BYTES')?.total || 0,
                searches: usageStats.find(s => s._id === 'VECTOR_SEARCH')?.total || 0,
                savings: usageStats.find(s => s._id === 'SAVINGS_TOKENS')?.total || 0,
            },
            industries: industryStats as unknown as IndustryStat[],
            recent_tenants: sanitizedTenants,
            infra: {
                region: process.env.PROVIDER_REGION || 'EU-WEST-1',
                cacheHitRate: '92.4%',
                ttlEnforcement: 'ENABLED'
            }
        };
    }

    /**
     * Get health metrics (Tenant scope)
     */
    static async getTenantHealth(tenantId: string): Promise<HealthData> {
        const [db, logsDb] = await Promise.all([
            connectDB(),
            connectLogsDB()
        ]);

        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const [
            ingestStats,
            ragLatency,
            securityAnomalies,
            activeUsersCount,
            activeProcessingCount,
            activeJobs
        ] = await Promise.all([
            db.collection('usage_logs').aggregate([
                { $match: { tenantId, tipo: 'DOCUMENT_INGEST', timestamp: { $gte: twentyFourHoursAgo } } },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]).toArray(),
            db.collection('usage_logs').aggregate([
                { $match: { tenantId, tipo: 'VECTOR_SEARCH', timestamp: { $gte: twentyFourHoursAgo } } },
                { $group: { _id: null, avgLatency: { $avg: "$duration" } } }
            ]).toArray(),
            logsDb.collection('application_logs').countDocuments({
                tenantId,
                level: { $in: ['WARN', 'ERROR'] },
                timestamp: { $gte: sevenDaysAgo },
                $or: [
                    { action: { $regex: /security/i } },
                    { action: 'SLA_VIOLATION' },
                    { action: 'UNAUTHORIZED_ACCESS' }
                ]
            }),
            db.collection('usage_logs').distinct('userId', {
                tenantId,
                timestamp: { $gte: twentyFourHoursAgo }
            }),
            db.collection('knowledge_assets').countDocuments({
                tenantId,
                ingestionStatus: 'PROCESSING'
            }),
            db.collection('knowledge_assets').find(
                { tenantId, ingestionStatus: 'PROCESSING' },
                { projection: { name: 1, ingestionStatus: 1, updatedAt: 1 }, limit: 5, sort: { updatedAt: -1 } }
            ).toArray()
        ]);

        const successes = ingestStats.find(s => s._id === 'SUCCESS')?.count || 0;
        const totalIngests = ingestStats.reduce((acc, s) => acc + s.count, 0);
        const ingestPercent = totalIngests > 0 ? (successes / totalIngests) * 100 : 100;

        let healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
        if (ingestPercent < 90 || securityAnomalies > 5) healthStatus = 'WARNING';
        if (ingestPercent < 70 || securityAnomalies > 20) healthStatus = 'CRITICAL';

        return {
            status: healthStatus,
            ingestSuccessRate: Math.round(ingestPercent),
            avgRagLatency: Math.round(ragLatency[0]?.avgLatency || 0),
            securityAnomaliesCount: securityAnomalies,
            activeUsers24h: activeUsersCount.length,
            activeProcessingCount: activeProcessingCount,
            activeJobs: activeJobs.map((j) => ({
                id: (j as any)._id.toString(),
                name: (j as any).name,
                status: (j as any).ingestionStatus,
                updatedAt: (j as any).updatedAt.toISOString()
            })),
            ingestSlaScore: 99.98,
            activeWorkers: 12,
            dlqSize: 0,
            analytics: {
                peakHour: "14:00 - 15:00",
                peakConcurrency: 14
            },
            timestamp: new Date().toISOString()
        };
    }
}
