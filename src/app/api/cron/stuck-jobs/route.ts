import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { StuckDetector } from '@/services/ingest/recovery/StuckDetector';
import { handleApiError } from '@/lib/errors';

async function GET_internal(request: NextRequest) {
    const correlationId = crypto.randomUUID();
    const authHeader = request.headers.get('authorization');

    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await StuckDetector.recoverStuckJobs();
        return NextResponse.json({ success: true, ...result, correlationId });
    } catch (error: unknown) {
        return handleApiError(error, 'API_CRON_STUCK', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/cron/stuck-jobs', thresholdMs: 10000 });
