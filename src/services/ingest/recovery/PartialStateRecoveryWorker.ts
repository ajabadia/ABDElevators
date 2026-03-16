import { logEvento } from '@/lib/logger';
import { getTenantCollection, TenantSession } from '@/lib/db-tenant';
import { StateTransitionValidator, IngestState } from '../core/StateTransitionValidator';
import { IngestService } from '../IngestService';
import { CorrelationIdService } from '@/services/observability/CorrelationIdService';
import { UserRole } from '@/types/roles';
import { ObjectId } from 'mongodb';

/**
 * PartialStateRecoveryWorker - Recovers jobs stuck in partial states:
 * - STORED_NO_INDEX: Files saved but vector sync failed
 * - INDEXED_NO_STORAGE: Vectors sync'd but file storage failed (rare)
 * - PARTIAL: Some features failed but others succeeded
 * 
 * Logic:
 * 1. Find assets in these states with attempts < 3
 * 2. Re-trigger the ingestion pipeline (idempotent)
 * 3. After 3 attempts, mark as FAILED with recovery error
 */

const RECOVERY_BATCH_SIZE = 20;

export class PartialStateRecoveryWorker {
    /**
     * Run recovery for partial states
     */
    static async runRecovery(session?: TenantSession | null): Promise<{ recovered: number; errors: number }> {
        let recovered = 0;
        let errors = 0;

        try {
            const collection = await getTenantCollection('knowledge_assets', session);

            // Find candidates for recovery
            const candidates = await collection.find({
                ingestionStatus: { $in: ['STORED_NO_INDEX', 'INDEXED_NO_STORAGE', 'PARTIAL'] },
                attempts: { $lt: 3 }
            }, { limit: RECOVERY_BATCH_SIZE });

            for (const asset of candidates) {
                const docId = asset._id.toString();
                const correlationId = CorrelationIdService.generate();
                const tenantId = asset.tenantId;

                try {
                    await logEvento({
                        level: 'INFO',
                        source: 'PARTIAL_RECOVERY',
                        action: 'RECOVERY_ATTEMPT',
                        message: `Attempting auto-recovery for doc ${docId} in state ${asset.ingestionStatus}`,
                        correlationId,
                        tenantId,
                        details: { docId, state: asset.ingestionStatus, attempts: asset.attempts }
                    });

                    // 1. Determine Repair Phase
                    const currentStatus = asset.ingestionStatus as string;
                    const repairPhase = currentStatus === 'STORED_NO_INDEX' ? 'INDEX_RETRY' :
                        currentStatus === 'INDEXED_NO_STORAGE' ? 'STORAGE_RETRY' : 'NONE';

                    // 2. Update status and tracking
                    await collection.updateOne(
                        { _id: asset._id },
                        {
                            $set: {
                                ingestionStatus: 'PROCESSING',
                                repairPhase,
                                repairErrorCode: null,
                                updatedAt: new Date()
                            },
                            $inc: { attempts: 1 }
                        }
                    );

                    // 3. Re-trigger ingestion
                    // IngestService.executeAnalysis is safe because analyzers and indexers are idempotent (upserts)
                    await IngestService.executeAnalysis(docId, {
                        correlationId,
                        userEmail: 'system-recovery@abd.com',
                        enableVision: asset.enableVision,
                        enableTranslation: asset.enableTranslation,
                        enableGraphRag: asset.enableGraphRag,
                        enableCognitive: asset.enableCognitive
                    });

                    recovered++;
                } catch (error: unknown) {
                    const err = error as Error;
                    errors++;

                    await logEvento({
                        level: 'ERROR',
                        source: 'PARTIAL_RECOVERY',
                        action: 'RECOVERY_ERROR',
                        message: `Failed recovery for doc ${docId}: ${err.message}`,
                        correlationId,
                        tenantId,
                        details: { docId, error: err.message }
                    });

                    // If max attempts reached, FSM will handle DEAD/FAILED in orchestrator if called there,
                    // but here we manually mark if we hit the limit during this run.
                    if ((asset.attempts || 0) + 1 >= 3) {
                        await collection.updateOne(
                            { _id: asset._id },
                            {
                                $set: {
                                    ingestionStatus: 'FAILED',
                                    repairPhase: 'NONE',
                                    repairErrorCode: err.message,
                                    error: `Recovery exhausted: ${err.message}`,
                                    updatedAt: new Date()
                                }
                            }
                        );
                    }
                }
            }

            return { recovered, errors };
        } catch (error: unknown) {
            const err = error as Error;
            console.error('[PARTIAL RECOVERY CRITICAL ERROR]', err);
            return { recovered: 0, errors: 0 };
        }
    }

    /**
     * Periodic check (Cron)
     */
    static async runPeriodicCheck(session?: TenantSession | null): Promise<void> {
        await logEvento({
            level: 'DEBUG',
            source: 'PARTIAL_RECOVERY',
            action: 'PERIODIC_CHECK_START',
            message: 'Starting partial state recovery check',
            correlationId: 'cron-partial-recovery'
        });

        const result = await this.runRecovery(session);

        if (result.recovered > 0 || result.errors > 0) {
            await logEvento({
                level: result.errors > 0 ? 'WARN' : 'INFO',
                source: 'PARTIAL_RECOVERY',
                action: 'PERIODIC_CHECK_COMPLETE',
                message: `Recovery check complete: ${result.recovered} recovered, ${result.errors} errors`,
                correlationId: 'cron-partial-recovery',
                details: result
            });
        }
    }
}
