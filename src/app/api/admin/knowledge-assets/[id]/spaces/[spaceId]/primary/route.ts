import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeAssetSpaceService } from '@/services/admin/KnowledgeAssetSpaceService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/admin/knowledge-assets/[id]/spaces/[spaceId]/primary
 */
async function POST_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string, spaceId: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_KA_SPACES', action: 'SET_PRIMARY' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('knowledge:assets', 'manage');
                const { id, spaceId } = await context.params;

                await log({ message: `Setting space ${spaceId} as primary for asset ${id}` });
                await KnowledgeAssetSpaceService.setPrimarySpace(id, spaceId, session.user.tenantId);

                return NextResponse.json({ success: true, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_KA_SPACES_PRIMARY_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/knowledge-assets/[id]/spaces/[spaceId]/primary', thresholdMs: 1000 });
