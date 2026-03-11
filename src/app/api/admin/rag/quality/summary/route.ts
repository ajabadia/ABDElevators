import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { QualityInsightsService } from '@/services/admin/quality-insights-service';
import { handleApiError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import crypto from 'node:crypto';

/**
 * GET /api/admin/rag/quality/summary
 * dashboard backend for RAG Quality monitoring.
 * Consolidates global stats, version comparisons and flow analysis.
 */
async function GET_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();

    try {
        const session = await requirePermission('rag:quality', 'read');
        const tenantId = session.user.tenantId;

        // Parallelize data fetching for better performance
        const [globalStats, versionComparison, flowAnalysis] = await Promise.all([
            QualityInsightsService.getGlobalQuality({ tenantId }),
            QualityInsightsService.getVersionComparison(tenantId),
            QualityInsightsService.getFlowAnalysis(tenantId)
        ]);

        return NextResponse.json({
            success: true,
            summary: {
                ...globalStats,
                versions: versionComparison,
                flows: flowAnalysis
            }
        });

    } catch (error: unknown) {
        return handleApiError(error, 'API_RAG_QUALITY_SUMMARY', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, {
    endpoint: 'GET /api/admin/rag/quality/summary',
    thresholdMs: 1000
});
