import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { ReportScheduleService } from '@/services/ops/report-schedule-service';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function GET_internal(request: NextRequest) {
    return await withCorrelation(
        { level: 'INFO', source: 'API_CRON_REPORTS', action: 'REPORT_JOB' },
        async ({ log, correlationId }) => {
            const authHeader = request.headers.get('authorization');

            if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
                await log({
                    level: 'WARN',
                    action: 'UNAUTHORIZED_ATTEMPT',
                    message: 'Unauthorized cron invocation attempt'
                });
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            try {
                await log({ action: 'START', message: 'Scheduled reports job started' });

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

                await log({
                    action: 'COMPLETED',
                    message: `Scheduled reports completed. Found: ${dueSchedules.length}, Processed: ${processedCount}, Errors: ${errorCount}`,
                    details: { found: dueSchedules.length, processed: processedCount, errors: errorCount }
                });

                return NextResponse.json({ 
                    success: true, 
                    found: dueSchedules.length, 
                    processed: processedCount, 
                    errors: errorCount 
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_CRON_REPORTS', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/cron/scheduled-reports', thresholdMs: 30000 });
