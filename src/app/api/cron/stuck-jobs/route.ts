import { NextResponse } from 'next/server';
import { StuckDetector } from '@/services/ingest/recovery/StuckDetector';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';

/**
 * GET /api/cron/stuck-jobs
 * Triggered by Vercel Cron to detect and recover stuck ingestion jobs.
 */
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    const correlationId = `cron-stuck-${Date.now()}`;

    // 1. Security Check (Vercel Cron Secret)
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const start = Date.now();

    try {
        await logEvento({
            level: 'INFO',
            source: 'API_CRON',
            action: 'STUCK_JOBS_CHECK',
            message: 'Starting cron check for stuck ingestion jobs',
            correlationId,
            tenantId: 'platform_master'
        });

        const result = await StuckDetector.recoverStuckJobs();

        const duration = Date.now() - start;

        await logEvento({
            level: result.recovered > 0 ? 'WARN' : 'INFO',
            source: 'API_CRON',
            action: 'STUCK_JOBS_COMPLETE',
            message: `Stuck job check complete: ${result.recovered} recovered, ${result.errors} errors`,
            correlationId,
            tenantId: 'platform_master',
            details: { ...result, duration_ms: duration }
        });

        return NextResponse.json({
            success: true,
            ...result,
            duration_ms: duration
        });

    } catch (error: any) {
        const duration = Date.now() - start;
        console.error('[CRON_API_ERROR]', error);

        await logEvento({
            level: 'ERROR',
            source: 'API_CRON',
            action: 'STUCK_JOBS_FAILED',
            message: `Cron check failed: ${error.message}`,
            correlationId,
            tenantId: 'platform_master',
            details: { error: error.message, stack: error.stack, duration_ms: duration }
        });

        if (error instanceof AppError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
