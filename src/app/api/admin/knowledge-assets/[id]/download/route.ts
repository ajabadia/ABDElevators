import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeAssetDownloadService } from '@/services/admin/KnowledgeAssetDownloadService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/knowledge-assets/[id]/download
 */
async function GET_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_KA_DOWNLOAD', action: 'DOWNLOAD' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('knowledge:assets', 'read');
                const { id } = await context.params;

                await log({ message: `Downloading knowledge asset ${id}` });
                const { stream, filename, contentType } = await KnowledgeAssetDownloadService.getDownloadStream(id, session.user.tenantId);

                return new NextResponse(stream, {
                    headers: {
                        'Content-Type': contentType,
                        'Content-Disposition': `attachment; filename="${filename}"`
                    }
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_KA_DOWNLOAD_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/knowledge-assets/[id]/download', thresholdMs: 5000 });
