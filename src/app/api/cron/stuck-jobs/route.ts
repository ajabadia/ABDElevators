import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { StuckDetector } from '@/services/ingest/recovery/StuckDetector';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

async function GET_internal(request: NextRequest) {
    return await withCorrelation(
        { level: 'INFO', source: 'API_CRON_STUCK', action: 'RECOVERY_JOB' },
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
                const result = await StuckDetector.recoverStuckJobs();
                await log({
                    action: 'RECOVERY_COMPLETED',
                    message: 'Stuck jobs recovery job completed',
                    details: result
                });
                return NextResponse.json({ success: true, ...result, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_CRON_STUCK', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/cron/stuck-jobs', thresholdMs: 10000 });
