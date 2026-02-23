/**
 * Finite State Machine (FSM) Validator for Ingestion Pipeline
 * 
 * Single Responsibility: Validate state transitions in ingestion lifecycle
 * Max Lines: < 200 (Modularization Rule)
 * 
 * Banking-Grade Traceability:
 * - All state transitions logged immutably
 * - Invalid transitions rejected and logged for forensics
 * - Transition history preserved for compliance audits
 */

import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';

/**
 * Ingestion lifecycle states (Extended with stuck/dead handling)
 */
export type IngestState =
    | 'PENDING'       // Created but not yet in queue
    | 'QUEUED'        // File uploaded, awaiting processing
    | 'PROCESSING'    // Actively being analyzed
    | 'COMPLETED'     // Successfully completed
    | 'FAILED'        // Processing failed (retryable)
    | 'STORED_NO_INDEX'   // Files saved but vector sync failed
    | 'INDEXED_NO_STORAGE' // Vectors sync'd but file storage failed
    | 'PARTIAL'       // Some features failed but others succeeded
    | 'STUCK'         // Processing timeout (requires manual intervention)
    | 'DEAD';         // Permanently failed after retries

/**
 * Valid state transitions per current state
 */
const STATE_TRANSITIONS: Record<IngestState, IngestState[]> = {
    PENDING: ['QUEUED', 'PROCESSING', 'FAILED'],
    QUEUED: ['PROCESSING', 'FAILED', 'STUCK'],
    PROCESSING: ['COMPLETED', 'FAILED', 'STUCK', 'STORED_NO_INDEX', 'INDEXED_NO_STORAGE', 'PARTIAL'],
    COMPLETED: ['QUEUED', 'PROCESSING'], // Era 6: Allowed for Enrichment (FASE 198)
    FAILED: ['QUEUED', 'PROCESSING', 'DEAD'], // Can retry or mark dead
    STORED_NO_INDEX: ['QUEUED', 'PROCESSING', 'COMPLETED'],
    INDEXED_NO_STORAGE: ['QUEUED', 'PROCESSING', 'COMPLETED'],
    PARTIAL: ['QUEUED', 'PROCESSING', 'COMPLETED'],
    STUCK: ['PROCESSING', 'DEAD'], // Can retry or abandon
    DEAD: ['QUEUED'], // Manual resurrection allowed for hard-retries
};

/**
 * State transition context for audit logging
 */
export interface StateTransitionContext {
    docId: string;
    correlationId: string;
    tenantId: string;
    userId?: string;
    reason?: string; // Why this transition happened
    metadata?: Record<string, any>; // Additional context
}

/**
 * FSM Validator for Ingestion State Machine
 * 
 * Ensures all state transitions are valid per defined rules:
 * - Prevents invalid transitions (e.g., COMPLETED -> QUEUED)
 * - Logs all transitions for compliance
 * - Detects stuck processing jobs
 */
export class StateTransitionValidator {
    /**
     * Validate and execute state transition
     * 
     * @throws AppError if transition is invalid
     */
    static async transition(
        currentState: IngestState,
        nextState: IngestState,
        context: StateTransitionContext
    ): Promise<void> {
        // Validate transition is allowed
        const allowedTransitions = STATE_TRANSITIONS[currentState];
        if (!allowedTransitions.includes(nextState)) {
            await this.logInvalidTransition(currentState, nextState, context);
            throw new AppError(
                'VALIDATION_ERROR',
                400,
                `Invalid transition: ${currentState} -> ${nextState}`
            );
        }

        // Log valid transition (banking-grade audit)
        await this.logValidTransition(currentState, nextState, context);
    }

    /**
     * Check if a document is stuck in processing
     * 
     * Stuck = PROCESSING for more than threshold duration
     * Default threshold: 5 minutes
     */
    static isStuck(
        currentState: IngestState,
        lastUpdated: Date,
        thresholdMs: number = 5 * 60 * 1000 // 5 minutes
    ): boolean {
        if (currentState !== 'PROCESSING') {
            return false;
        }

        const now = Date.now();
        const age = now - lastUpdated.getTime();
        return age > thresholdMs;
    }

    /**
     * Log valid state transition (banking-grade audit)
     */
    private static async logValidTransition(
        fromState: IngestState,
        toState: IngestState,
        context: StateTransitionContext
    ): Promise<void> {
        await logEvento({
            level: 'INFO',
            source: 'INGEST_FSM',
            action: 'STATE_TRANSITION',
            message: `Document state: ${fromState} -> ${toState}`,
            correlationId: context.correlationId,
            details: {
                docId: context.docId,
                tenantId: context.tenantId,
                userId: context.userId,
                fromState,
                toState,
                reason: context.reason,
                metadata: context.metadata,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Log invalid state transition (forensic analysis)
     */
    private static async logInvalidTransition(
        fromState: IngestState,
        toState: IngestState,
        context: StateTransitionContext
    ): Promise<void> {
        await logEvento({
            level: 'ERROR',
            source: 'INGEST_FSM',
            action: 'INVALID_TRANSITION_ATTEMPT',
            message: `Invalid transition attempted: ${fromState} -> ${toState}`,
            correlationId: context.correlationId,
            details: {
                docId: context.docId,
                tenantId: context.tenantId,
                userId: context.userId,
                fromState,
                toState,
                allowedTransitions: STATE_TRANSITIONS[fromState],
                reason: context.reason,
                metadata: context.metadata,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Get allowed transitions for a state
     */
    static getAllowedTransitions(state: IngestState): IngestState[] {
        return STATE_TRANSITIONS[state];
    }

    /**
     * Check if state is terminal (no further transitions allowed)
     */
    static isTerminalState(state: IngestState): boolean {
        return STATE_TRANSITIONS[state].length === 0;
    }
}
