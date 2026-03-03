import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { ReportScheduleService } from '@/services/ops/report-schedule-service';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function GET_internal(request: NextRequest) {
    const correlationId = crypto.randomUUID();
    const authHeader = request.headers.get('authorization');

    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const dueSchedules = await ReportScheduleService.getDueSchedules();
        let processedCount = 0;
        let errorCount = 0;

        for (const schedule of dueSchedules) {
            try {
                await ReportScheduleService.executeSchedule(schedule);
                processedCount++;
            } catch (err) {
                errorCount++;
            }
        }

        return NextResponse.json({ success: true, found: dueSchedules.length, processed: processedCount, errors: errorCount });
    } catch (error: unknown) {
        return handleApiError(error, 'API_CRON_REPORTS', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/cron/scheduled-reports', thresholdMs: 30000 });
