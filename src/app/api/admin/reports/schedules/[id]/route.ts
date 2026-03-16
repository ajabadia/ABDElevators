import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { ReportScheduleService } from '@/services/admin/report-schedule-service';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/reports/schedules/[id]
 */
async function GET_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_REPORTS', action: 'GET_SCHEDULE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('reports', 'read');
                const { id } = await context.params;

                const schedule = await ReportScheduleService.getSchedule(id, session.user.tenantId);

                return NextResponse.json({ success: true, schedule, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_REPORTS_SCHEDULE_GET', correlationId);
            }
        }
    );
}

/**
 * DELETE /api/admin/reports/schedules/[id]
 */
async function DELETE_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_REPORTS', action: 'DELETE_SCHEDULE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('reports', 'manage');
                const { id } = await context.params;

                await log({ message: `Deleting report schedule ${id}`, tenantId: session.user.tenantId });
                await ReportScheduleService.deleteSchedule(id, session.user.tenantId);

                return NextResponse.json({ success: true, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_REPORTS_SCHEDULE_DELETE', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/reports/schedules/[id]', thresholdMs: 1000 });
export const DELETE = withPerformanceSLA(DELETE_internal, { endpoint: 'DELETE /api/admin/reports/schedules/[id]', thresholdMs: 1000 });
