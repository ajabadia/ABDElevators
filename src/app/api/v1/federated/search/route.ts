import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from "next/server";
import { FederatedKnowledgeService } from '@/services/core/FederatedKnowledgeService';
import { requirePermission } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';

async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('knowledge:asset', 'read');
        const { query, limit } = await req.json();

        if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 });

        const tenantId = session.user.tenantId;
        const results = await FederatedKnowledgeService.searchGlobalPatterns(query, tenantId, correlationId, limit || 3);

        return NextResponse.json({ success: true, data: results });
    } catch (error: unknown) {
        return handleApiError(error, 'API_FEDERATED_SEARCH_V1', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/v1/federated/search', thresholdMs: 1000 });
