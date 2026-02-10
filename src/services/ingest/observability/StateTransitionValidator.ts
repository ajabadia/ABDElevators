import { logEvento } from '@/lib/logger';
import crypto from 'crypto';

/**
 * Valid ingestion state transitions for banking-grade traceability.
 * Phase 3: State Machine & Recovery
 */

export type IngestionState = 'PENDING' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'STUCK';

interface StateTransition {
    from: IngestionState;
    to: IngestionState;
    timestamp: Date;
    docId: string;
    correlationId: string;
    tenantId: string;
    reason?: string;
    auditHash: string; // SHA-256 for immutability
}

/**
 * Valid state transition rules
 */
const VALID_TRANSITIONS: Record<IngestionState, IngestionState[]> = {
    'PENDING': ['QUEUED', 'FAILED'], // Can queue or fail immediately
    'QUEUED': ['PROCESSING', 'FAILED'], // Can start processing or fail
    'PROCESSING': ['COMPLETED', 'FAILED', 'PROCESSING', 'STUCK'], // Can complete, fail, retry, or get stuck
    'COMPLETED': [], // Terminal state (no transitions allowed)
    'FAILED': ['PENDING'], // Can retry from failed (manual override only)
    'STUCK': ['PENDING', 'FAILED'], // Can retry or mark as permanently failed
};

export class StateTransitionValidator {
    /**
     * Validates a state transition and logs to audit trail.
     * Throws error if transition is invalid.
     */
    static async validate(
        currentState: IngestionState,
        nextState: IngestionState,
        correlationId: string,
        tenantId: string,
        docId: string,
        reason?: string,
        allowOverride = false
    ): Promise<void> {
        const isValidTransition = VALID_TRANSITIONS[currentState]?.includes(nextState) || false;

        // Special case: FAILED -> PENDING requires explicit override
        if (currentState === 'FAILED' && nextState === 'PENDING' && !allowOverride) {
            throw new Error(
                `Invalid state transition: ${currentState} -> ${nextState}. Manual retry override required.`
            );
        }

        if (!isValidTransition && !allowOverride) {
            await logEvento({
                level: 'ERROR',
                source: 'STATE_VALIDATOR',
                action: 'INVALID_TRANSITION',
                message: `Invalid state transition attempted: ${currentState} -> ${nextState}`,
                correlationId,
                tenantId,
                details: { docId, currentState, nextState, reason }
            });

            throw new Error(
                `Invalid state transition: ${currentState} -> ${nextState}. Valid transitions from ${currentState}: ${VALID_TRANSITIONS[currentState]?.join(', ') || 'none'}`
            );
        }

        // Create immutable audit entry
        const transition: StateTransition = {
            from: currentState,
            to: nextState,
            timestamp: new Date(),
            docId,
            correlationId,
            tenantId,
            reason,
            auditHash: this.hashTransition(currentState, nextState, docId, correlationId)
        };

        await logEvento({
            level: 'INFO',
            source: 'STATE_VALIDATOR',
            action: 'TRANSITION_VALIDATED',
            message: `State transition: ${currentState} -> ${nextState}`,
            correlationId,
            tenantId,
            details: transition
        });
    }

    /**
     * Creates SHA-256 hash for banking-grade immutability
     */
    private static hashTransition(
        from: IngestionState,
        to: IngestionState,
        docId: string,
        correlationId: string
    ): string {
        const data = `${from}|${to}|${docId}|${correlationId}|${Date.now()}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Get valid next states for a given current state
     */
    static getValidNextStates(currentState: IngestionState): IngestionState[] {
        return VALID_TRANSITIONS[currentState] || [];
    }

    /**
     * Check if a transition is valid without throwing
     */
    static isValidTransition(from: IngestionState, to: IngestionState): boolean {
        return VALID_TRANSITIONS[from]?.includes(to) || false;
    }

    /**
     * Auto-mark asset as STUCK when a transition fails.
     * This is called by the FSM when an invalid transition is attempted.
     */
    static async markAsStuck(
        docId: string,
        currentState: IngestionState,
        attemptedState: IngestionState,
        correlationId: string,
        tenantId: string,
        reason: string
    ): Promise<void> {
        const { getTenantCollection } = await import('@/lib/db-tenant');
        const collection = await getTenantCollection('knowledge_assets');

        await collection.updateOne(
            { _id: docId as any },
            {
                $set: {
                    ingestionStatus: 'STUCK',
                    stuckReason: `Invalid transition: ${currentState} -> ${attemptedState}. Reason: ${reason}`,
                    stuckAt: new Date(),
                }
            }
        );

        await logEvento({
            level: 'WARN',
            source: 'STATE_VALIDATOR',
            action: 'AUTO_MARKED_STUCK',
            message: `Asset ${docId} auto-marked as STUCK due to invalid transition`,
            correlationId,
            tenantId,
            details: { docId, currentState, attemptedState, reason }
        });
    }
}
