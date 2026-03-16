import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { Neo4jNodeService } from '@/services/admin/Neo4jNodeService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/admin/graph/nodes/bulk
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_GRAPH_NODES_BULK', action: 'PROCESS' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('knowledge:graph', 'manage');
                const body = await req.json();

                await log({ message: `Bulk processing ${body.nodes?.length || 0} nodes` });
                const result = await Neo4jNodeService.processBulk(body.nodes, session.user.tenantId, correlationId);

                return NextResponse.json({ success: true, result, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_GRAPH_NODES_BULK_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/graph/nodes/bulk', thresholdMs: 5000 });
