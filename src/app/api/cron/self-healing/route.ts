import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { SelfHealingService } from '@/services/ops/self-healing-service';
import { PartialStateRecoveryWorker } from '@/services/ingest/recovery/PartialStateRecoveryWorker';
import { DeadLetterQueue } from '@/services/ingest/recovery/DeadLetterQueue';
import { handleApiError } from '@/lib/errors';

async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const authHeader = req.headers.get('authorization') || req.headers.get('x-cron-secret');

    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}` && authHeader !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Audit Expired Assets (Tier 0)
        const expiredResult = await SelfHealingService.auditExpiredAssets(correlationId);

        // 2. Partial State Recovery (Tier 1 - Phase 249)
        const partialRecoveryResult = await PartialStateRecoveryWorker.runRecovery();

        // 3. DLQ Auto-Retry (Tier 1 - Phase 249)
        await DeadLetterQueue.processAutoRetries();

        return NextResponse.json({
            success: true,
            correlationId,
            expired: expiredResult,
            partialRecovery: partialRecoveryResult,
            dlqRetriesInitiated: true
        });
    } catch (error: unknown) {
        return handleApiError(error, 'CRON_SELF_HEALING', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/cron/self-healing', thresholdMs: 30000 });
