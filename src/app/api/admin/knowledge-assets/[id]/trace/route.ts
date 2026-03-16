import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeAssetTraceService } from '@/services/admin/KnowledgeAssetTraceService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/knowledge-assets/[id]/trace
 */
async function GET_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_KA_TRACE', action: 'GET_LINEAGE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('knowledge:assets', 'read');
                const { id } = await context.params;

                const trace = await KnowledgeAssetTraceService.getAssetTrace(id, session.user.tenantId);

                return NextResponse.json({ success: true, trace, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_KA_TRACE_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/knowledge-assets/[id]/trace', thresholdMs: 1000 });
