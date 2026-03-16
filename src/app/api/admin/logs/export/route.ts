import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { AuditExportService } from '@/services/admin/stub-services';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/logs/export
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_LOGS_EXPORT', action: 'STREAM' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('audit:logs', 'read');
                
                await log({ message: 'Starting admin logs export stream' });
                const stream = await AuditExportService.getLogsStream(session.user.tenantId);

                return new NextResponse(stream, {
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString()}.csv"`
                    }
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_LOGS_EXPORT_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/logs/export', thresholdMs: 10000 });
