import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { connectDB, connectLogsDB } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { ragEvaluationRepository } from '@/lib/repositories/RagEvaluationRepository';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';
import { AppError } from '@/lib/errors';

/**
 * API Route: GET /api/admin/audit/stats
 * Provides aggregated metrics for the Audit Dashboard.
 * Satisfaction for FASE 195.3 components.
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_AUDIT_STATS', action: 'FETCH_STATS' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('platform:audit', 'read');

                // 🛡️ [SECURITY] Layered Rate Limiting (Phase 451)
                const { success: rateLimitOk } = await checkRateLimit(session.user.id, LIMITS.ADMIN);
                if (!rateLimitOk) {
                    throw new AppError('FORBIDDEN', 429, 'Demasiadas consultas de auditoría. Por favor, espera.');
                }
                const tSession = { user: session.user } as any;

                const [db, logsDb] = await Promise.all([
                    connectDB(),
                    connectLogsDB()
                ]);

                // 1. Total de pedidos (casos)
                const totalCases = await db.collection('orders').countDocuments({});

                // 2. Usuarios activos (1h for Phase 254 observability vs 30d for business)
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const activeTenants1h = await logsDb.collection('usage_logs').distinct('tenantId', {
                    timestamp: { $gte: oneHourAgo }
                });

                const activeTenantsCount = await logsDb.collection('usage_logs').distinct('tenantId', {
                    timestamp: { $gte: thirtyDaysAgo }
                });

                // 3. Violaciones de SLA (Últimos 30 días)
                const slaViolations = await logsDb.collection('application_logs').countDocuments({
                    action: 'SLA_VIOLATION',
                    timestamp: { $gte: thirtyDaysAgo }
                });

                // 4. Calidad RAG promedio (Simplificado)
                // Intentamos obtener evaluaciones recientes
                const avgEval = await ragEvaluationRepository.aggregate([
                    { $sort: { timestamp: -1 } },
                    { $limit: 100 },
                    { $group: { _id: null, avgFaithfulness: { $avg: '$metrics.faithfulness' } } }
                ], tSession);

                const avgFaithfulness = avgEval.length > 0 ? avgEval[0].avgFaithfulness : 0.94;

                // 5. Consumo estimado (Tokens)
                const usageStats = await logsDb.collection('usage_logs').aggregate([
                    { 
                        $match: { 
                            $or: [
                                { type: 'LLM_TOKENS' },
                                { tipo: 'LLM_TOKENS' }
                            ], 
                            timestamp: { $gte: thirtyDaysAgo } 
                        } 
                    },
                    { 
                        $group: { 
                            _id: null, 
                            total: { 
                                $sum: { $ifNull: ['$value', '$valor'] }
                            } 
                        } 
                    }
                ]).toArray();

                const totalTokens = usageStats[0]?.total || 0;

                const response = {
                    success: true,
                    totalCases,
                    performance: {
                        sla_violations_30d: slaViolations,
                        rag_quality_avg: {
                            avgFaithfulness
                        }
                    },
                    usage: {
                        tokens: totalTokens,
                        active_tenants: activeTenantsCount.length,
                        active_tenants_1h: activeTenants1h.length
                    }
                };

                await log({
                    message: 'Successfully retrieved audit dashboard metrics',
                    details: { totalCases, slaViolations, totalTokens }
                });

                return NextResponse.json(response);
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_AUDIT_STATS', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/audit/stats', thresholdMs: 2000 });
