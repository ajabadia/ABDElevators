import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { AdminExportService } from '@/services/admin/AdminExportService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/export
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_EXPORT', action: 'STREAM_DATA' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('platform:settings', 'manage');
                const { searchParams } = new URL(req.url);
                const type = searchParams.get('type') || 'full';

                await log({ message: `Starting administrative export: ${type}` });
                const stream = await AdminExportService.getExportStream(type, session.user.tenantId);

                return new NextResponse(stream, {
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        'Content-Disposition': `attachment; filename="admin-export-${type}-${Date.now()}.zip"`
                    }
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_EXPORT_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/export', thresholdMs: 10000 });
