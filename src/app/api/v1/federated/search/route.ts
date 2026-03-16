import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from "next/server";
import { FederatedKnowledgeService } from '@/services/core/FederatedKnowledgeService';
import { requirePermission } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/v1/federated/search
 * Performs a search across global federated patterns.
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'APIFEDERATED_SEARCH', action: 'GLOBAL_SEARCH' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('knowledge:asset', 'read');
                const { query, limit } = await req.json();

                if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 });

                const tenantId = session.user.tenantId;
                const results = await FederatedKnowledgeService.searchGlobalPatterns(query, tenantId, correlationId, limit || 3);

                await log({
                    message: `Global federated search: ${query.substring(0, 30)}`,
                    details: {
                        tenantId,
                        resultsCount: results.length,
                        limit: limit || 3
                    }
                });

                return NextResponse.json({ success: true, data: results, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'APIFEDERATED_SEARCH', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/v1/federated/search', thresholdMs: 1000 });
