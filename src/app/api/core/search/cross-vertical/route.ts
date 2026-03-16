import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from '@/lib/auth';
import { getCrossVerticalEngine } from "@/core/engine/index.server";
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/core/search/cross-vertical
 * Performs a semantic search across verticals (Horizontal Search).
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'APICORE_SEARCH_CROSS', action: 'HORIZONTAL_SEARCH' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('rag:query', 'read');
                const { query } = await req.json();
                const tenantId = session.user.tenantId;

                if (!query) {
                    return NextResponse.json({ error: "Query required" }, { status: 400 });
                }

                const data = await getCrossVerticalEngine().semanticHorizontalSearch(
                    query,
                    tenantId,
                    correlationId
                );

                await log({
                    message: 'Semantic horizontal search performed',
                    details: {
                        query: query.substring(0, 50) + (query.length > 50 ? '...' : ''),
                        verticals: data.results?.length || 0,
                        tenantId
                    }
                });

                return NextResponse.json({
                    success: true,
                    ...data, 
                    correlationId
                });
            } catch (error: unknown) {
                return handleApiError(error, 'APICORE_SEARCH_CROSS', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/core/search/cross-vertical', thresholdMs: 1000 });
