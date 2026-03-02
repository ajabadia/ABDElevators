import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { RagEvaluationService } from '@/services/core/rag-evaluation-service';
import { AppError, handleApiError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';

/**
 * GET /api/admin/rag/evaluations
 * Returns metrics and recent evaluations for the dashboard
 */
async function GET_internal (req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const user = await enforcePermission('rag:evaluation', 'read');
        const tenantId = (user as any).tenantId;

        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID no encontrado en la sesión');
        }

        const [metrics, recentEvaluations] = await Promise.all([
            RagEvaluationService.getMetrics(tenantId),
            RagEvaluationService.listEvaluations(tenantId, 50)
        ]);

        return NextResponse.json({
            success: true,
            metrics: metrics.summary,
            trends: metrics.trends,
            evaluations: recentEvaluations
        });

    } catch (error) {
        return handleApiError(error, 'API_ADMIN_RAG_EVAL_GET', correlacion_id);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/rag/evaluations', thresholdMs: 1000 });
