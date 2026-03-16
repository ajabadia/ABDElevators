import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeAssetSpaceService } from '@/services/admin/stub-services';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/knowledge-assets/[id]/spaces
 */
async function GET_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_KA_SPACES', action: 'LIST' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('knowledge:assets', 'read');
                const { id } = await context.params;

                const spaces = await KnowledgeAssetSpaceService.listSpacesForAsset(id, session.user.tenantId);

                return NextResponse.json({ success: true, spaces, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_KA_SPACES_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/knowledge-assets/[id]/spaces', thresholdMs: 1000 });
