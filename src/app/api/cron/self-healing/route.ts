import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { SelfHealingService } from '@/services/ops/self-healing-service';
import { PartialStateRecoveryWorker } from '@/services/ingest/recovery/PartialStateRecoveryWorker';
import { DeadLetterQueue } from '@/services/ingest/recovery/DeadLetterQueue';
import { handleApiError } from '@/lib/errors';
import { OpsPlaybookService } from '@/services/ops/OpsPlaybookService';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

async function POST_internal(req: NextRequest) {
    return await withCorrelation(
        { level: 'INFO', source: 'CRON_SELF_HEALING', action: 'AUTO_HEAL_JOB' },
        async ({ log, correlationId }) => {
            const authHeader = req.headers.get('authorization') || req.headers.get('x-cron-secret');
            const isCronAuthorized = process.env.NODE_ENV !== 'production' ||
                authHeader === `Bearer ${process.env.CRON_SECRET}` ||
                authHeader === process.env.CRON_SECRET;

            try {
                if (!isCronAuthorized) {
                    // If not authorized via secret, check for SUPER_ADMIN session
                    await requirePermission('technical:ops', 'write');
                }

                await log({
                    action: 'START',
                    message: 'Self-healing job initiated'
                });

                // 1. Audit Expired Assets (Tier 0)
                const expiredResult = await SelfHealingService.auditExpiredAssets(correlationId);

                // 2. Partial State Recovery (Tier 1 - Phase 249)
                const partialRecoveryResult = await PartialStateRecoveryWorker.runRecovery();

                // 3. DLQ Auto-Retry (Tier 1 - Phase 249)
                await DeadLetterQueue.processAutoRetries();

                // 4. Operational Autopilot (Tier 2 - Phase 251)
                const autopilotResult = await OpsPlaybookService.runGlobal(correlationId);

                await log({
                    action: 'COMPLETED',
                    message: 'Self-healing job completed successfully',
                    details: { expiredResult, partialRecoveryResult, autopilotResult }
                });

                return NextResponse.json({
                    success: true,
                    correlationId,
                    expired: expiredResult,
                    partialRecovery: partialRecoveryResult,
                    dlqRetriesInitiated: true,
                    autopilot: autopilotResult
                });
            } catch (error: unknown) {
                return handleApiError(error, 'CRON_SELF_HEALING', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/cron/self-healing', thresholdMs: 30000 });
