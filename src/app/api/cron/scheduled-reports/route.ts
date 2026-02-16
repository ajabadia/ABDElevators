import { NextResponse } from 'next/server';
import { ReportScheduleService } from '@/lib/services/report-schedule-service';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';

// Force dynamic to ensure it runs every time
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow 60s for execution

/**
 * GET /api/cron/scheduled-reports
 * Triggered by Vercel Cron to generate and deliver scheduled reports.
 */
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    const correlationId = `cron-sched-reports-${Date.now()}`;

    // 1. Security Check (Vercel Cron Secret)
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const start = Date.now();
    let processedCount = 0;
    let errorCount = 0;

    try {
        await logEvento({
            level: 'INFO',
            source: 'API_CRON_REPORTS',
            action: 'CHECK_START',
            message: 'Checking for due report schedules',
            correlationId,
            tenantId: 'platform_master'
        });

        const dueSchedules = await ReportScheduleService.getDueSchedules();

        if (dueSchedules.length > 0) {
            await logEvento({
                level: 'INFO',
                source: 'API_CRON_REPORTS',
                action: 'EXECUTION_START',
                message: `Found ${dueSchedules.length} schedules due for execution`,
                correlationId,
                tenantId: 'platform_master'
            });

            // Execute sequentially to avoid resource spikes
            for (const schedule of dueSchedules) {
                try {
                    await ReportScheduleService.executeSchedule(schedule);
                    processedCount++;
                } catch (err) {
                    console.error(`Error executing schedule ${schedule._id}:`, err);
                    errorCount++;
                }
            }
        }

        const duration = Date.now() - start;

        await logEvento({
            level: errorCount > 0 ? 'WARN' : 'INFO',
            source: 'API_CRON_REPORTS',
            action: 'CHECK_COMPLETE',
            message: `Report schedule check complete. Processed: ${processedCount}. Errors: ${errorCount}. Duration: ${duration}ms`,
            correlationId,
            tenantId: 'platform_master',
            details: { found: dueSchedules.length, processed: processedCount, errors: errorCount, duration_ms: duration }
        });

        return NextResponse.json({
            success: true,
            found: dueSchedules.length,
            processed: processedCount,
            errors: errorCount,
            duration_ms: duration
        });

    } catch (error: any) {
        const duration = Date.now() - start;
        console.error('[CRON_REPORTS_ERROR]', error);

        await logEvento({
            level: 'ERROR',
            source: 'API_CRON_REPORTS',
            action: 'CHECK_FAILED',
            message: `Cron check failed: ${error.message}`,
            correlationId,
            tenantId: 'platform_master',
            details: { error: error.message, stack: error.stack, duration_ms: duration }
        });

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
