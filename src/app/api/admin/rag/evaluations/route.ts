import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { ragEvaluationRepository } from '@/lib/repositories/RagEvaluationRepository';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/rag/evaluations
 * Recupera las métricas de evaluación RAG (faithfulness, answer_relevance, context_precision)
 * junto con el histórico y la tendencia de evolución para el dashboard de calidad.
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_RAG_EVALS', action: 'GET_DASHBOARD' },
        async ({ log, correlationId }) => {
            try {
                const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
                const tSession = { user: session.user } as any;

                // 1. Extraer las últimas 20 evaluaciones
                const evaluations = await ragEvaluationRepository.list({}, { sort: { timestamp: -1 }, limit: 20 }, tSession);

                // 2. Aggregación de medias globales
                const metricsAggr = await ragEvaluationRepository.aggregate([
                    {
                        $group: {
                            _id: null,
                            faithfulness: { $avg: "$metrics.faithfulness" },
                            answer_relevance: { $avg: "$metrics.answer_relevance" },
                            context_precision: { $avg: "$metrics.context_precision" },
                            count: { $sum: 1 }
                        }
                    }
                ], tSession);
                const metrics = metricsAggr[0] || { faithfulness: 0, answer_relevance: 0, context_precision: 0, count: 0 };

                // 3. Tendencia (Trends) de los últimos 14 días
                const trends = await ragEvaluationRepository.aggregate([
                    {
                        $group: {
                            _id: {
                                $dateToString: {
                                    format: "%Y-%m-%d",
                                    date: { $toDate: "$timestamp" }
                                }
                            },
                            faithfulness: { $avg: "$metrics.faithfulness" },
                            relevance: { $avg: "$metrics.answer_relevance" }
                        }
                    },
                    { $sort: { _id: 1 } },
                    { $limit: 14 }
                ], tSession);

                await log({
                    message: 'RAG evaluation dashboard metrics retrieved',
                    details: { evaluationCount: evaluations.length, globalCount: metrics.count }
                });

                return NextResponse.json({
                    success: true,
                    metrics,
                    trends,
                    evaluations
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_RAG_EVALS', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'API_ADMIN_RAG_EVALS', thresholdMs: 1000 });
