import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { AnomalyDetectionService } from '@/services/ops/AnomalyDetectionService';
import { SovereignOntologyService } from '@/services/core/SovereignOntologyService';
import { handleApiError } from '@/lib/errors';

async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const authHeader = req.headers.get('authorization') || req.headers.get('x-cron-secret');

    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}` && authHeader !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [latencyAnomalies, errorAnomalies] = await Promise.all([
            AnomalyDetectionService.detectLatencyAnomalies(),
            AnomalyDetectionService.detectErrorAnomalies(),
            SovereignOntologyService.applyAutonomousRefinements('SYSTEM', correlationId)
        ]);

        return NextResponse.json({ success: true, detectedCount: latencyAnomalies.length + errorAnomalies.length, correlationId });
    } catch (error: unknown) {
        return handleApiError(error, 'CRON_PREDICTIVE_AUDIT', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/cron/status-check', thresholdMs: 10000 });
