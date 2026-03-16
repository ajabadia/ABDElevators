import { logEvento } from '@/lib/logger';
import { getTenantCollection } from '@/lib/db-tenant';
import { StateTransitionValidator, IngestState } from '../core/StateTransitionValidator';
import { DeadLetterQueue } from './DeadLetterQueue';
import { IngestAuditService } from '../IngestAuditService';
import { TenantSession } from '@/lib/db-tenant';

/**
 * Stuck Job Detector - Finds and recovers jobs stuck in PROCESSING
 * Phase 3: Error Recovery & Resilience
 */

const STUCK_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
const QUEUED_STUCK_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes (Phase 413)

export interface StuckJobReport {
    docId: string;
    tenantId: string;
    stuckDuration: number; // milliseconds
    correlationId?: string;
    filename?: string;
}

export class StuckDetector {
    /**
     * Detect jobs stuck in PROCESSING state for > 30 mins
     */
    static async detectStuckJobs(session?: TenantSession | null): Promise<StuckJobReport[]> {
        const stuckJobs: StuckJobReport[] = [];
        const thresholdDate = new Date(Date.now() - STUCK_THRESHOLD_MS);

        try {
            // Query all tenants (admin operation)
            const collection = await getTenantCollection('knowledge_assets', session);

            const stuck = await collection.find({
                ingestionStatus: 'PROCESSING',
                updatedAt: { $lt: thresholdDate }
            }).toArray();

            for (const job of stuck) {
                const stuckDuration = Date.now() - new Date(job.updatedAt).getTime();

                stuckJobs.push({
                    docId: job._id.toString(),
                    tenantId: job.tenantId,
                    stuckDuration,
                    correlationId: job.correlationId,
                    filename: job.filename
                });

                await logEvento({
                    level: 'WARN',
                    source: 'STUCK_DETECTOR',
                    action: 'STUCK_JOB_DETECTED',
                    message: `Job stuck in PROCESSING for ${Math.round(stuckDuration / 60000)} mins`,
                    correlationId: job.correlationId || 'stuck-detector',
                    tenantId: job.tenantId,
                    details: {
                        docId: job._id.toString(),
                        filename: job.filename,
                        stuckDuration
                    }
                });
            }

            return stuckJobs;
        } catch (error: unknown) {
            const err = error as Error;
            console.error('[STUCK DETECTOR ERROR]', err);
            return [];
        }
    }

    /**
     * Recover stuck jobs by transitioning to FAILED and adding to Dead Letter Queue
     */
    static async recoverStuckJobs(session?: TenantSession | null): Promise<{ recovered: number; errors: number }> {
        const stuckJobs = await this.detectStuckJobs(session);
        let recovered = 0;
        let errors = 0;

        for (const job of stuckJobs) {
            try {
                // Validate and execute state transition: PROCESSING -> STUCK
                // Using the more robust transition method
                await StateTransitionValidator.transition('PROCESSING', 'STUCK', {
                    docId: job.docId,
                    correlationId: job.correlationId || 'stuck-recovery',
                    tenantId: job.tenantId,
                    userId: 'SYSTEM_STUCK_DETECTOR',
                    reason: `Job stuck in PROCESSING for > 30 mins (auto-detected)`
                });

                // Update status to STUCK
                const collection = await getTenantCollection('knowledge_assets', session, 'MAIN');
                const { ObjectId } = await import('mongodb');
                await collection.updateOne(
                    { _id: new ObjectId(job.docId) },
                    {
                        $set: {
                            ingestionStatus: 'STUCK',
                            error: `Job stuck in PROCESSING for ${Math.round(job.stuckDuration / 60000)} mins (auto-detected)`,
                            updatedAt: new Date()
                        }
                    }
                );

                // Add to Dead Letter Queue
                await DeadLetterQueue.addToQueue({
                    tenantId: job.tenantId,
                    docId: job.docId,
                    correlationId: job.correlationId || 'stuck-recovery',
                    jobType: 'PDF_ANALYSIS',
                    failureReason: `Stuck in PROCESSING for ${Math.round(job.stuckDuration / 60000)} mins`,
                    retryCount: 0,
                    lastAttempt: new Date()
                }, session);

                // 📝 Trace recovery in document audit trail (Phase 413)
                await IngestAuditService.logEvent({
                    tenantId: job.tenantId,
                    performedBy: 'SYSTEM_STUCK_DETECTOR',
                    filename: job.filename || 'unknown',
                    sizeBytes: 0,
                    md5: 'unknown',
                    docId: job.docId,
                    correlationId: job.correlationId || 'stuck-recovery',
                    action: 'RECOVER_PROCESSING_STALL',
                    status: 'FAILED',
                    details: {
                        duration_ms: job.stuckDuration,
                        source: 'STUCK_DETECTOR',
                        error: `Stuck in PROCESSING for ${Math.round(job.stuckDuration / 60000)} mins`
                    }
                }, session as any);

                await logEvento({
                    level: 'INFO',
                    source: 'STUCK_DETECTOR',
                    action: 'JOB_RECOVERED',
                    message: `Recovered stuck job: ${job.filename || job.docId}`,
                    correlationId: job.correlationId || 'stuck-recovery',
                    tenantId: job.tenantId,
                    details: { docId: job.docId, stuckDuration: job.stuckDuration }
                });

                recovered++;
            } catch (error: unknown) {
                const err = error as Error;
                console.error(`[STUCK RECOVERY ERROR] ${job.docId}`, err);
                errors++;

                await logEvento({
                    level: 'ERROR',
                    source: 'STUCK_DETECTOR',
                    action: 'RECOVERY_ERROR',
                    message: `Failed to recover stuck job: ${err.message}`,
                    correlationId: job.correlationId || 'stuck-recovery',
                    tenantId: job.tenantId,
                    details: { docId: job.docId, error: err.message }
                });
            }
        }

        await logEvento({
            level: 'INFO',
            source: 'STUCK_DETECTOR',
            action: 'RECOVERY_COMPLETE',
            message: `Stuck job recovery complete: ${recovered} recovered, ${errors} errors`,
            correlationId: 'stuck-recovery-batch'
        });

        return { recovered, errors };
    }

    /**
     * Re-enqueue jobs that are stuck in QUEUED state (Queue probably failed or lost them)
     * Phase 413: Auto-Recovery
     */
    static async recoverStuckQueuedJobs(session?: TenantSession | null): Promise<{ reEnqueued: number; errors: number }> {
        const thresholdDate = new Date(Date.now() - QUEUED_STUCK_THRESHOLD_MS);
        let reEnqueued = 0;
        let errors = 0;

        try {
            const collection = await getTenantCollection('knowledge_assets', session);
            const stuckQueued = await collection.find({
                ingestionStatus: 'QUEUED',
                updatedAt: { $lt: thresholdDate }
            }).toArray();

            if (stuckQueued.length === 0) return { reEnqueued, errors };

            const { ingestionQueue } = await import('@/services/ops/simple-queue/simple-queue');

            for (const job of stuckQueued) {
                try {
                    // Update updatedAt to prevent immediate re-fetching
                    // The standard MongoDB Node.js driver takes _id directly in updates without new ObjectId() if it's already an ObjectId
                    // We assume job._id is an object generated by Mongo.
                    await collection.updateOne(
                        { _id: job._id },
                        { $set: { updatedAt: new Date(), attempts: (job.attempts || 0) + 1 } }
                    );

                    ingestionQueue.add(job._id.toString(), {
                        tenantId: job.tenantId,
                        userId: 'SYSTEM_RECOVERY',
                        correlationId: job.correlationId || 'stuck-queue-recovery',
                        maskPii: true, 
                        enableVision: false,
                        enableTranslation: false,
                        enableGraphRag: false,
                        userEmail: 'system@recovery.local',
                        environment: 'PRODUCTION',
                        attempts: (job.attempts || 0) + 1
                    });

                    await logEvento({
                        level: 'WARN',
                        source: 'STUCK_DETECTOR',
                        action: 'QUEUED_JOB_RE_ENQUEUED',
                        message: `Re-enqueued stuck QUEUED job: ${job.filename || job._id.toString()}`,
                        correlationId: job.correlationId || 'stuck-queue-recovery',
                        tenantId: job.tenantId,
                        details: { docId: job._id.toString(), idleMs: Date.now() - new Date(job.updatedAt).getTime() }
                    });

                    // 📝 Trace recovery in document audit trail (Phase 413)
                    await IngestAuditService.logEvent({
                        tenantId: job.tenantId,
                        performedBy: 'SYSTEM_STUCK_DETECTOR',
                        filename: job.filename || 'unknown',
                        sizeBytes: 0,
                        md5: 'unknown',
                        docId: job._id.toString(),
                        correlationId: job.correlationId || 'stuck-queue-recovery',
                        action: 'RECOVER_QUEUED_STALL',
                        status: 'PROCESSING',
                        details: {
                            duration_ms: Date.now() - new Date(job.updatedAt).getTime(),
                            source: 'STUCK_DETECTOR',
                            note: 'Re-enqueued stuck QUEUED job'
                        }
                    }, session);

                    reEnqueued++;
                } catch (error: unknown) {
                    errors++;
                    const err = error as Error;
                    await logEvento({
                        level: 'ERROR',
                        source: 'STUCK_DETECTOR',
                        action: 'QUEUED_RECOVERY_ERROR',
                        message: `Failed to re-enqueue stuck job: ${err.message}`,
                        correlationId: job.correlationId || 'stuck-queue-recovery',
                        tenantId: job.tenantId,
                        details: { docId: job._id.toString(), error: err.stack }
                    });
                }
            }
        } catch (error) {
           console.error('[STUCK QUEUE DETECTOR ERROR]', error);
        }

        return { reEnqueued, errors };
    }

    /**
     * Run periodic detection (called by cron job every 5 mins)
     */
    static async runPeriodicCheck(session?: TenantSession | null): Promise<void> {
        await logEvento({
            level: 'DEBUG',
            source: 'STUCK_DETECTOR',
            action: 'PERIODIC_CHECK_START',
            message: 'Starting periodic stuck job detection',
            correlationId: 'cron-stuck-detector'
        });

        const result = await this.recoverStuckJobs(session);
        const queuedResult = await this.recoverStuckQueuedJobs(session);

        await logEvento({
            level: (result.recovered > 0 || queuedResult.reEnqueued > 0) ? 'WARN' : 'DEBUG',
            source: 'STUCK_DETECTOR',
            action: 'PERIODIC_CHECK_COMPLETE',
            message: `Periodic check complete: ${result.recovered} jobs recovered (PROCESSING), ${queuedResult.reEnqueued} jobs re-enqueued (QUEUED)`,
            correlationId: 'cron-stuck-detector',
            details: { processing: result, queued: queuedResult }
        });
    }
}
