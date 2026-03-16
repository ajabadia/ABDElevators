import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { AppError, handleApiError } from '@/lib/errors';
import { UserRole } from '@/types/roles';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * 📊 Global Platform Metrics API (Phase 110)
 * Aggregates high-level metrics across all tenants for SuperAdmins.
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_SUPERADMIN_METRICS', action: 'GET_GLOBAL_SUMMARY' },
        async ({ log, correlationId }) => {
            try {
                // Rule #11: Multi-tenant Harmony - Secure access via Guardian
                const session = await requirePermission('technical:ops', 'read');

                // Security Gate: Only SuperAdmins can access global metrics
                if (session.user.role !== UserRole.SUPER_ADMIN) {
                    throw new AppError('FORBIDDEN', 403, 'Solo SuperAdmins pueden acceder a métricas globales');
                }

                // 🛡️ Request system session with platform_master context
                const systemSession = {
                    user: {
                        id: 'system-superadmin-metrics',
                        tenantId: 'platform_master',
                        role: UserRole.SUPER_ADMIN,
                    }
                };

                // 1. Tenant Metrics
                const tenantsCollection = await getTenantCollection('tenants', systemSession, 'AUTH');
                const totalTenants = await tenantsCollection.countDocuments({});
                const activeTenants = await tenantsCollection.countDocuments({ status: 'active' });

                // 2. Case Metrics
                const casesCollection = await getTenantCollection('cases', systemSession);
                const totalCases = await casesCollection.unsecureRawCollection.countDocuments({ deletedAt: { $exists: false } });

                // 3. Knowledge Metrics
                const assetsCollection = await getTenantCollection('knowledge_assets', systemSession);
                const assetSummary = await assetsCollection.unsecureRawCollection.aggregate([
                    { $match: { deletedAt: { $exists: false } } },
                    {
                        $group: {
                            _id: null,
                            totalSize: { $sum: '$sizeBytes' },
                            totalAssets: { $count: {} },
                            obsoleteCount: {
                                $sum: { $cond: [{ $eq: ['$status', 'obsoleto'] }, 1, 0] }
                            }
                        }
                    }
                ]).toArray();

                const { totalSize = 0, totalAssets = 0, obsoleteCount = 0 } = assetSummary[0] || {};

                // 4. AI Performance Metrics
                const feedbackCollection = await getTenantCollection('ai_human_feedback', systemSession);
                const feedbackSummary = await feedbackCollection.unsecureRawCollection.aggregate([
                    {
                        $group: {
                            _id: null,
                            total: { $count: {} },
                            corrections: {
                                $sum: { $cond: [{ $ne: ['$modelSuggestion', '$humanDecision'] }, 1, 0] }
                            }
                        }
                    }
                ]).toArray();

                const { total = 0, corrections = 0 } = feedbackSummary[0] || {};
                const accuracy = total > 0 ? ((total - corrections) / total) * 100 : 100;

                // 5. Era 7: LLM Telemetry (Observability Hub)
                const { ObservabilityService } = await import('@/services/observability/ObservabilityService');
                const telemetry = await ObservabilityService.getAITelemetry(7);

                // 6. Usage & Revenue Metrics (Cross-tenant)
                const usageCollection = await getTenantCollection('usage_logs', systemSession);
                const usageSummary = await usageCollection.unsecureRawCollection.aggregate([
                    {
                        $group: {
                            _id: '$tenantId',
                            totalTokens: { $sum: { $cond: [{ $eq: ['$type', 'LLM_TOKENS'] }, '$value', 0] } },
                            totalStorage: { $sum: { $cond: [{ $eq: ['$type', 'STORAGE_BYTES'] }, '$value', 0] } },
                            totalSavings: { $sum: { $cond: [{ $eq: ['$type', 'SAVINGS_TOKENS'] }, '$value', 0] } }
                        }
                    },
                    { $sort: { totalTokens: -1 } as any },
                    { $limit: 10 }
                ]).toArray();

                // 6. Global Platform Financials (Estimations)
                const totalTokens = usageSummary.reduce((acc, curr) => acc + curr.totalTokens, 0);
                const COST_PER_1M_TOKENS = 2.0; // Dynamic scaling? No, fixed for MVP
                const estimatedAIExpenditure = (totalTokens / 1_000_000) * COST_PER_1M_TOKENS;

                const totalSavedTokens = usageSummary.reduce((acc, curr) => acc + curr.totalSavings, 0);
                const ROI_MULTIPLIER = 1.5; // Saving tokens + efficiency
                const estimatedPlatformValue = (totalSavedTokens / 1_000_000) * (COST_PER_1M_TOKENS * ROI_MULTIPLIER);

                // 7. Predictive Analytics (Fase 110)
                const { UsageService } = await import('@/services/ops/usage-service');
                const costPrediction = await UsageService.getGlobalCostPrediction();

                // 8. Case Trends (Fase 440)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const sixtyDaysAgo = new Date();
                sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

                const [recentCases, olderCases] = await Promise.all([
                    casesCollection.unsecureRawCollection.countDocuments({ 
                        createdAt: { $gte: thirtyDaysAgo },
                        deletedAt: { $exists: false }
                    }),
                    casesCollection.unsecureRawCollection.countDocuments({ 
                        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
                        deletedAt: { $exists: false }
                    })
                ]);

                const casesTrend = olderCases > 0 
                    ? `+${Math.round(((recentCases - olderCases) / olderCases) * 100)}%`
                    : recentCases > 0 ? '+100%' : '0%';

                // 9. System Metadata & Multi-Cluster Health (Fase 440)
                const { AIMODELIDS } = await import('@/lib/ai-models');
                const { getNeo4jDriver } = await import('@/lib/neo4j');
                
                // Comprehensive Health Probe for all Clusters (MongoDB + Neo4j)
                const [mainHealth, authHealth, logsHealth, configHealth, neo4jHealth] = await Promise.all([
                    casesCollection.unsecureRawCollection.db.admin().ping().then(() => 'OK').catch(() => 'ERROR'),
                    tenantsCollection.unsecureRawCollection.db.admin().ping().then(() => 'OK').catch(() => 'ERROR'),
                    (await getTenantCollection('audit_trails', systemSession, 'LOGS')).unsecureRawCollection.db.admin().ping().then(() => 'OK').catch(() => 'ERROR'),
                    (await getTenantCollection('checklist_configs', systemSession, 'CONFIG')).unsecureRawCollection.db.admin().ping().then(() => 'OK').catch(() => 'ERROR'),
                    getNeo4jDriver().then(d => d.verifyConnectivity()).then(() => 'OK').catch(() => 'ERROR')
                ]);

                await log({
                    message: 'Global platform metrics generated successfully',
                    details: { totalTenants, totalCases, accuracy: accuracy.toFixed(1) }
                });

                return NextResponse.json({
                    tenants: { total: totalTenants, active: activeTenants },
                    cases: { total: totalCases, trend: casesTrend },
                    knowledge: {
                        totalAssets,
                        obsoleteAssets: obsoleteCount,
                        totalSizeBytes: totalSize,
                        totalGB: Number((totalSize / (1024 ** 3)).toFixed(2))
                    },
                    ai: {
                        accuracy: Number(accuracy.toFixed(1)),
                        totalFeedbacks: total,
                        correctionsCount: corrections,
                        telemetry: telemetry.summary,
                        health: telemetry.health
                    },
                    system: {
                        environment: process.env.NODE_ENV === 'production' ? 'PRODUCCIÓN / VERCEL' : 'DEVELOPMENT / LOCAL',
                        aiEngine: AIMODELIDS.RAG_GENERATOR
                    },
                    clusters: {
                        MAIN: mainHealth,
                        AUTH: authHealth,
                        LOGS: logsHealth,
                        CONFIG: configHealth,
                        NEO4J: neo4jHealth
                    },
                    usage: {
                        topTenants: usageSummary.map((t: any) => ({
                            tenantId: t._id,
                            tokens: t.totalTokens,
                            storage: t.totalStorage,
                            savings: t.totalSavings
                        })),
                        global: {
                            totalTokens,
                            estimatedCost: Number(estimatedAIExpenditure.toFixed(2)),
                            estimatedValue: Number(estimatedPlatformValue.toFixed(2)),
                            roi: ROI_MULTIPLIER
                        },
                        prediction: costPrediction
                    },
                    timestamp: new Date(),
                    correlationId
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_SUPERADMIN_METRICS', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/superadmin/metrics', thresholdMs: 2000 });
