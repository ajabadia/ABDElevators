import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeAssetManagementService } from '@/services/admin/KnowledgeAssetManagementService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/admin/knowledge-assets/[id]/retry
 */
async function POST_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_KA_RETRY', action: 'RETRY' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('knowledge:assets', 'manage');
                const { id } = await context.params;

                await log({ message: `Retrying processing for knowledge asset ${id}` });
                await KnowledgeAssetManagementService.retryAsset(id, session.user.tenantId, correlationId);

                return NextResponse.json({ success: true, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_KA_RETRY_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/knowledge-assets/[id]/retry', thresholdMs: 2000 });
