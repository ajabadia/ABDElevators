import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeAssetSpaceService } from '@/services/admin/KnowledgeAssetSpaceService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/knowledge-assets/[id]/spaces/[spaceId]
 */
async function GET_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string, spaceId: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_KA_SPACES', action: 'GET_DETAIL' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('knowledge:assets', 'read');
                const { id, spaceId } = await context.params;

                const space = await KnowledgeAssetSpaceService.getSpaceDetail(id, spaceId, session.user.tenantId);

                return NextResponse.json({ success: true, space, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_KA_SPACES_DETAIL_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/knowledge-assets/[id]/spaces/[spaceId]', thresholdMs: 1000 });
