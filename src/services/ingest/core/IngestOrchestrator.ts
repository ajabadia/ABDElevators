import { ObjectId } from 'mongodb';
import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { StateTransitionValidator, IngestState } from './StateTransitionValidator';
import { LLMCostTracker } from '../observability/LLMCostTracker';
import { IngestService } from '../IngestService';

/**
 * IngestOrchestrator: Centralized control for ingestion lifecycle.
 * Ensures strict state management, cost persistence, and execution metrics.
 */
export class IngestOrchestrator {
    /**
     * Coordinate the full ingestion sequence for a document.
     */
    static async coordinate(
        docId: string,
        correlationId: string,
        options: {
            userEmail: string;
            tenantId: string;
            isEnrichment?: boolean;
            [key: string]: any;
        }
    ) {
        const start = Date.now();
        const knowledgeAssetsCollection = await getTenantCollection('knowledge_assets', {
            user: { id: 'system_orchestrator', tenantId: options.tenantId, role: 'SUPER_ADMIN' }
        });

        const assetId = new ObjectId(docId);
        const asset = await knowledgeAssetsCollection.findOne({ _id: assetId });

        if (!asset) {
            throw new AppError('NOT_FOUND', 404, `Knowledge asset ${docId} not found`);
        }

        let currentState = asset.ingestionStatus as IngestState;

        // Self-Healing Phase 209: Detect Stuck Tasks (PROCESSING or QUEUED)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        const isProcessingStuck = currentState === 'PROCESSING' && (asset.updatedAt < tenMinutesAgo);
        const isQueuedStuck = currentState === 'QUEUED' && (asset.updatedAt < thirtyMinutesAgo);

        if (isProcessingStuck || isQueuedStuck) {
            const action = isProcessingStuck ? 'STUCK_PROCESSING_DETECTED' : 'STUCK_QUEUED_DETECTED';
            const targetState: IngestState = isProcessingStuck ? 'STUCK' : 'PENDING';

            await logEvento({
                level: 'WARN',
                source: 'INGEST_ORCHESTRATOR',
                action,
                message: `Task ${docId} stuck in ${currentState} for too long. Resetting to ${targetState}.`,
                correlationId,
                tenantId: options.tenantId
            });
            currentState = targetState;
            await knowledgeAssetsCollection.updateOne({ _id: assetId }, { $set: { ingestionStatus: targetState, updatedAt: new Date() } });
        }

        // Dead Task Logic (Phase 199)
        const attempts = (asset.attempts || 0);
        if (attempts >= 3 && !options.force) {
            await knowledgeAssetsCollection.updateOne(
                { _id: assetId },
                { $set: { ingestionStatus: 'DEAD', updatedAt: new Date() } }
            );
            throw new AppError('CONFLICT', 409, `Task ${docId} marked as DEAD after ${attempts} failed attempts.`);
        }

        const nextState: IngestState = 'PROCESSING';

        try {
            // 1. Validate Transition
            await StateTransitionValidator.transition(currentState, nextState, {
                docId,
                correlationId,
                tenantId: options.tenantId,
                userId: options.userEmail,
                reason: options.isEnrichment ? 'ENRICHMENT_REQUEST' : (isStuck ? 'STUCK_RECOVERY' : 'INITIAL_PROCESSING')
            });

            // 2. Mark as Processing (Unified update)
            await knowledgeAssetsCollection.updateOne(
                { _id: assetId },
                {
                    $set: {
                        ingestionStatus: nextState,
                        attempts: attempts + 1,
                        updatedAt: new Date(),
                        correlationId // Ensure latest correlationId is linked
                    }
                }
            );

            // 3. Execute Analysis (Delegating to IngestService for now)
            const result = await IngestService.executeAnalysis(docId, options);

            // 4. Persistence of Costs & Final State
            await LLMCostTracker.persistSummary(correlationId, docId, options.tenantId);

            // 5. Transition to final state (usually COMPLETED)
            // Note: IngestService.executeAnalysis currently updates the asset to COMPLETED itself.
            // In a future refactor, we would pull that logic here.

            const duration = Date.now() - start;
            await knowledgeAssetsCollection.updateOne(
                { _id: assetId },
                {
                    $set: {
                        'executionMetrics.durationMs': duration,
                        'executionMetrics.lastStep': 'ORCHESTRATION_COMPLETE'
                    }
                }
            );

            return result;

        } catch (error: any) {
            // Handle Failure Transitions
            const failureState: IngestState = 'FAILED';

            try {
                await StateTransitionValidator.transition(nextState, failureState, {
                    docId,
                    correlationId,
                    tenantId: options.tenantId,
                    userId: options.userEmail,
                    reason: error.message
                });
            } catch (fsmError) {
                console.error('[INGEST_ORCHESTRATOR] Critical FSM Failure during error handling', fsmError);
            }

            // Ensure cost even on failure
            await LLMCostTracker.persistSummary(correlationId, docId, options.tenantId).catch(e => console.error('[COST_PERSIST_FAIL]', e));

            await logEvento({
                level: 'ERROR',
                source: 'INGEST_ORCHESTRATOR',
                action: 'ORCHESTRATION_FAILED',
                message: `Ingestion failed for doc ${docId}: ${error.message}`,
                correlationId,
                details: { error: error.message, stack: error.stack }
            });

            throw error;
        } finally {
            // Cleanup memory (last line of defense)
            LLMCostTracker.clearDocument(correlationId);
        }
    }
}
