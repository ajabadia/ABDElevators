import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { runQuery } from '@/lib/neo4j';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/graph/relations
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_GRAPH_RELATIONS', action: 'LIST' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('knowledge:graph', 'read');
                const tenantId = session.user.tenantId;

                const cypher = `
                    MATCH ()-[r]->()
                    WHERE r.tenantId = $tenantId
                    RETURN DISTINCT type(r) as type
                `;
                const result = await runQuery(cypher, { tenantId });
                const types = result.records.map(rec => rec.get('type'));

                return NextResponse.json({ success: true, types, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_GRAPH_RELATIONS_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/graph/relations', thresholdMs: 1000 });
