import { ObjectId } from 'mongodb';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { StateTransitionValidator, IngestState } from './StateTransitionValidator';
import { LLMCostTracker } from '@/services/ingest/observability/LLMCostTracker';
import { IngestService } from '@/services/ingest/IngestService';
import { knowledgeAssetRepository } from '@/lib/repositories/KnowledgeAssetRepository';
import { UserRole } from '@/types/roles';
import { EntityId, TenantId } from '@/lib/schemas/common';
import { type TenantSession } from '@/lib/db-tenant';

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
            force?: boolean;
            [key: string]: unknown;
        }
    ) {
        const start = Date.now();
        const tenantId = options.tenantId as TenantId;
        const session: TenantSession = {
            user: {
                id: 'system', // Internal system identifier
                tenantId,
                role: UserRole.SUPER_ADMIN
            }
        };

        const asset = await knowledgeAssetRepository.getEntity(docId, session);

        if (!asset) {
            throw new AppError('NOT_FOUND', 404, `Knowledge asset ${docId} not found`);
        }

        let currentState = asset.ingestionStatus as IngestState;

        // Self-Healing Phase 209: Detect Stuck Tasks (PROCESSING or QUEUED)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        const assetUpdatedAt = asset.updatedAt ? new Date(asset.updatedAt) : (asset.createdAt ? new Date(asset.createdAt) : new Date());
        const isProcessingStuck = currentState === 'PROCESSING' && (assetUpdatedAt.getTime() < tenMinutesAgo.getTime());
        const isQueuedStuck = currentState === 'QUEUED' && (assetUpdatedAt.getTime() < thirtyMinutesAgo.getTime());
        const isStuck = isProcessingStuck || isQueuedStuck;

        if (isStuck) {
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
            await knowledgeAssetRepository.update(docId, { ingestionStatus: targetState, updatedAt: new Date() }, session);
        }

        // Dead Task Logic (Phase 199)
        const attempts = (asset.attempts || 0);
        if (attempts >= 3 && !options.force) {
            await knowledgeAssetRepository.update(
                docId,
                { ingestionStatus: 'DEAD', updatedAt: new Date() },
                session
            );
            throw new AppError('CONFLICT', 409, `Task ${docId} marked as DEAD after ${attempts} failed attempts.`);
        }

        // 1.5. Self-Healing Tier 1: Handle Partial States (Phase 249)
        const isPartial = ['STORED_NO_INDEX', 'INDEXED_NO_STORAGE', 'PARTIAL'].includes(currentState);
        if (isPartial) {
            await logEvento({
                level: 'INFO',
                source: 'INGEST_ORCHESTRATOR',
                action: 'PARTIAL_STATE_RECOVERY',
                message: `Transitioning doc ${docId} from partial state ${currentState} to PROCESSING`,
                correlationId,
                tenantId: options.tenantId
            });
            // Reset to PENDING so transition to PROCESSING is valid
            currentState = 'PENDING';
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
            await knowledgeAssetRepository.update(
                docId,
                {
                    ingestionStatus: nextState,
                    attempts: attempts + 1,
                    updatedAt: new Date(),
                    correlationId // Ensure latest correlationId is linked
                },
                session
            );

            // 3. Execute Analysis (Delegating to IngestService for now)
            const result = await IngestService.executeAnalysis(docId, {
                ...options,
                isEnrichment: !!options.isEnrichment,
                correlationId
            } as any); // IngestService expectations might still be vague

            // 4. Persistence of Costs & Final State
            await LLMCostTracker.persistSummary(correlationId, docId, options.tenantId);

            const duration = Date.now() - start;
            await knowledgeAssetRepository.update(
                docId,
                {
                    executionMetrics: {
                        ...asset.executionMetrics,
                        durationMs: duration,
                        lastStep: 'ORCHESTRATION_COMPLETE'
                    }
                },
                session
            );

            return result;

        } catch (error: unknown) {
            const err = error as Error;
            // Handle Failure Transitions
            const failureState: IngestState = 'FAILED';

            try {
                await StateTransitionValidator.transition(nextState, failureState, {
                    docId,
                    correlationId,
                    tenantId: options.tenantId,
                    userId: options.userEmail,
                    reason: err.message
                });
            } catch (fsmError: unknown) {
                const fErr = fsmError as Error;
                console.error('[INGEST_ORCHESTRATOR] Critical FSM Failure during error handling', fErr);
            }

            // Ensure cost even on failure
            await LLMCostTracker.persistSummary(correlationId, docId, options.tenantId).catch(e => console.error('[COST_PERSIST_FAIL]', e));

            await logEvento({
                level: 'ERROR',
                source: 'INGEST_ORCHESTRATOR',
                action: 'ORCHESTRATION_FAILED',
                message: `Ingestion failed for doc ${docId}: ${err.message}`,
                correlationId,
                details: { error: err.message, stack: err.stack }
            });

            throw err;
        } finally {
            // Cleanup memory (last line of defense)
            LLMCostTracker.clearDocument(correlationId);
        }
    }
}
