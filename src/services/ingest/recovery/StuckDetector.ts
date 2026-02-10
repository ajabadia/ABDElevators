import { logEvento } from '@/lib/logger';
import { getTenantCollection } from '@/lib/db-tenant';
import { StateTransitionValidator } from '../observability/StateTransitionValidator';
import { DeadLetterQueue } from './DeadLetterQueue';

/**
 * Stuck Job Detector - Finds and recovers jobs stuck in PROCESSING
 * Phase 3: Error Recovery & Resilience
 */

const STUCK_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

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
    static async detectStuckJobs(session?: any): Promise<StuckJobReport[]> {
        const stuckJobs: StuckJobReport[] = [];
        const thresholdDate = new Date(Date.now() - STUCK_THRESHOLD_MS);

        try {
            // Query all tenants (admin operation)
            const collection = await getTenantCollection('knowledge_assets', session);

            const stuck = await collection.find({
                ingestionStatus: 'PROCESSING',
                updatedAt: { $lt: thresholdDate }
            });

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
        } catch (error: any) {
            console.error('[STUCK DETECTOR ERROR]', error);
            return [];
        }
    }

    /**
     * Recover stuck jobs by transitioning to FAILED and adding to Dead Letter Queue
     */
    static async recoverStuckJobs(session?: any): Promise<{ recovered: number; errors: number }> {
        const stuckJobs = await this.detectStuckJobs(session);
        let recovered = 0;
        let errors = 0;

        for (const job of stuckJobs) {
            try {
                // Validate state transition: PROCESSING -> FAILED
                await StateTransitionValidator.validate(
                    'PROCESSING',
                    'FAILED',
                    job.correlationId || 'stuck-recovery',
                    job.tenantId,
                    job.docId,
                    `Job stuck in PROCESSING for > 30 mins (auto-detected)`
                );

                // Update status to FAILED
                const collection = await getTenantCollection('knowledge_assets', session, 'MAIN');
                const { ObjectId } = await import('mongodb');
                await collection.updateOne(
                    { _id: new ObjectId(job.docId) as any },
                    {
                        $set: {
                            ingestionStatus: 'FAILED',
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
                    retryCount: 0, // Stuck detection, not retry
                    lastAttempt: new Date()
                }, session);

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
            } catch (error: any) {
                console.error(`[STUCK RECOVERY ERROR] ${job.docId}`, error);
                errors++;

                await logEvento({
                    level: 'ERROR',
                    source: 'STUCK_DETECTOR',
                    action: 'RECOVERY_ERROR',
                    message: `Failed to recover stuck job: ${error.message}`,
                    correlationId: job.correlationId || 'stuck-recovery',
                    tenantId: job.tenantId,
                    details: { docId: job.docId, error: error.message }
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
     * Run periodic detection (called by cron job every 5 mins)
     */
    static async runPeriodicCheck(session?: any): Promise<void> {
        await logEvento({
            level: 'DEBUG',
            source: 'STUCK_DETECTOR',
            action: 'PERIODIC_CHECK_START',
            message: 'Starting periodic stuck job detection',
            correlationId: 'cron-stuck-detector'
        });

        const result = await this.recoverStuckJobs(session);

        await logEvento({
            level: result.recovered > 0 ? 'WARN' : 'DEBUG',
            source: 'STUCK_DETECTOR',
            action: 'PERIODIC_CHECK_COMPLETE',
            message: `Periodic check complete: ${result.recovered} jobs recovered`,
            correlationId: 'cron-stuck-detector',
            details: result
        });
    }
}
