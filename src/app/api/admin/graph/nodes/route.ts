import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { Neo4jNodeService } from '@/services/admin/Neo4jNodeService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/graph/nodes
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_GRAPH_NODES', action: 'LIST' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('knowledge:graph', 'read');
                const { searchParams } = new URL(req.url);
                const query = searchParams.get('q') || '';

                const nodes = await Neo4jNodeService.searchNodes(query, session.user.tenantId);

                return NextResponse.json({ success: true, nodes, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_GRAPH_NODES_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/graph/nodes', thresholdMs: 1000 });
