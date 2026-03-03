import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { connectDB, connectAuthDB, connectLogsDB } from '@/lib/db';
import { AppError } from '@/lib/errors';

/**
 * GET /api/admin/global-stats
 * Devuelve métricas globales de toda la plataforma (Solo SUPER_ADMIN).
 * SLA: P95 < 500ms
 */
async function GET_internal(req: NextRequest) {
    try {
        const session = await enforcePermission('platform:metrics', 'read');

        // 1. Parallelize Database Connections
        const [db, authDb, logsDb] = await Promise.all([
            connectDB(),
            connectAuthDB(),
            connectLogsDB()
        ]);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 2. Parallelize All Data Fetching Operations
        const [
            totalTenants,
            totalUsers,
            totalFiles,
            totalCases,
            mau,
            mrrStats,
            usageStats,
            slaViolations,
            recentErrors,
            industryStats,
            ragQuality,
            tenants
        ] = await Promise.all([
            // Basic Totals
            authDb.collection('tenants').countDocuments(),
            authDb.collection('users').countDocuments(),
            db.collection('knowledge_assets').countDocuments(),
            db.collection('pedidos').countDocuments(),

            // MAU (Optimized: just count distinct tenantIds)
            db.collection('usage_logs').distinct('tenantId', {
                timestamp: { $gte: thirtyDaysAgo }
            }),

            // MRR Stats
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

            // Usage Stats
            db.collection('usage_logs').aggregate([
                { $group: { _id: "$tipo", total: { $sum: "$valor" } } }
            ]).toArray(),

            // Performance / Logs
            logsDb.collection('application_logs').countDocuments({
                action: 'SLA_VIOLATION',
                timestamp: { $gte: thirtyDaysAgo }
            }),
            logsDb.collection('application_logs').countDocuments({
                level: 'ERROR',
                timestamp: { $gte: thirtyDaysAgo }
            }),

            // Industries
            authDb.collection('tenants').aggregate([
                { $group: { _id: "$industry", count: { $sum: 1 } } }
            ]).toArray(),

            // RAG Quality
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

            // Recent Tenants
            authDb.collection('tenants')
                .find({}, { projection: { name: 1, 'subscription.tier': 1, createdAt: 1 } })
                .sort({ createdAt: -1 })
                .limit(5)
                .toArray()
        ]);

        const estimatedMRR = mrrStats[0]?.totalMRR || 0;

        return NextResponse.json({
            success: true,
            global: {
                totalTenants,
                totalUsers,
                totalFiles,
                totalCases,
                mau: mau.length,
                mrr: estimatedMRR,
                performance: {
                    sla_violations_30d: slaViolations,
                    errors_30d: recentErrors,
                    rag_quality_avg: ragQuality[0] || null
                },
                usage: {
                    tokens: usageStats.find(s => (s._id as any) === 'LLM_TOKENS')?.total || 0,
                    storage: usageStats.find(s => (s._id as any) === 'STORAGE_BYTES')?.total || 0,
                    searches: usageStats.find(s => (s._id as any) === 'VECTOR_SEARCH')?.total || 0,
                    savings: usageStats.find(s => (s._id as any) === 'SAVINGS_TOKENS')?.total || 0,
                },
                industries: industryStats,
                recent_tenants: tenants.reverse()
            }
        });

    } catch (error: unknown) {
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(new AppError('INTERNAL_ERROR', 500, message).toJSON(), { status: 500 });
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/global-stats', thresholdMs: 500 });
