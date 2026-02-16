/**
 * LLM Retry Wrapper with Banking-Grade Audit
 * 
 * Single Responsibility: Retry failed LLM API calls with exponential backoff
 * Max Lines: < 150 (Modularization Rule)
 * 
 * Banking-Grade Traceability:
 * - All retry attempts logged immutably
 * - Exponential backoff with jitter
 * - Timeout enforcement
 */

import { logEvento } from '@/lib/logger';

/**
 * LLM Retry Options
 */
export interface LLMRetryOptions {
    maxRetries?: number;        // Default: 3
    initialDelayMs?: number;    // Default: 1000ms
    backoffMultiplier?: number; // Default: 2
    timeoutMs?: number;         // Default: 60000ms (60s)
    correlationId?: string;
}

/**
 * Retry failed LLM operations with exponential backoff
 * 
 * @param fn - Async function to retry
 * @param context - Context for logging (operation name, tenant, etc.)
 * @param options - Retry configuration
 * @returns Result of successful execution
 * @throws Last error if all retries exhausted
 */
export async function withLLMRetry<T>(
    fn: () => Promise<T>,
    context: {
        operation: string;
        tenantId: string;
        correlationId?: string;
    },
    options?: LLMRetryOptions
): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;
    const initialDelayMs = options?.initialDelayMs ?? 1000;
    const backoffMultiplier = options?.backoffMultiplier ?? 2;
    const timeoutMs = options?.timeoutMs ?? 60000;
    const correlationId = context.correlationId || options?.correlationId || 'llm-retry';

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // Wrap with timeout
            const result = await Promise.race([
                fn(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('LLM operation timeout')), timeoutMs)
                ),
            ]);

            // Success - log if this was a retry
            if (attempt > 0) {
                await logRetrySuccess(context, attempt, correlationId);
            }

            return result;
        } catch (error) {
            lastError = error as Error;

            // Log retry attempt
            await logRetryAttempt(context, attempt, maxRetries, lastError, correlationId);

            // If final attempt, throw
            if (attempt === maxRetries) {
                await logRetryExhausted(context, maxRetries, lastError, correlationId);
                throw lastError;
            }

            // Calculate delay with jitter
            const delay = calculateDelay(attempt, initialDelayMs, backoffMultiplier);
            await sleep(delay);
        }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError!;
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateDelay(attempt: number, initialDelayMs: number, multiplier: number): number {
    const exponentialDelay = initialDelayMs * Math.pow(multiplier, attempt);
    const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter
    return Math.floor(exponentialDelay + jitter);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Log retry attempt (audit trail)
 */
async function logRetryAttempt(
    context: { operation: string; tenantId: string },
    attempt: number,
    maxRetries: number,
    error: Error,
    correlationId: string
): Promise<void> {
    await logEvento({
        level: 'WARN',
        source: 'LLM_RETRY',
        action: 'RETRY_ATTEMPT',
        message: `LLM ${context.operation} failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}`,
        correlationId,
        details: {
            operation: context.operation,
            tenantId: context.tenantId,
            attempt: attempt + 1,
            maxRetries: maxRetries + 1,
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack,
            timestamp: new Date().toISOString(),
        },
    });
}

/**
 * Log successful retry (audit trail)
 */
async function logRetrySuccess(
    context: { operation: string; tenantId: string },
    attempt: number,
    correlationId: string
): Promise<void> {
    await logEvento({
        level: 'INFO',
        source: 'LLM_RETRY',
        action: 'RETRY_SUCCESS',
        message: `LLM ${context.operation} succeeded after ${attempt} retries`,
        correlationId,
        details: {
            operation: context.operation,
            tenantId: context.tenantId,
            retriesNeeded: attempt,
            timestamp: new Date().toISOString(),
        },
    });
}

/**
 * Log exhausted retries (audit trail)
 */
async function logRetryExhausted(
    context: { operation: string; tenantId: string },
    maxRetries: number,
    error: Error,
    correlationId: string
): Promise<void> {
    await logEvento({
        level: 'ERROR',
        source: 'LLM_RETRY',
        action: 'RETRY_EXHAUSTED',
        message: `LLM ${context.operation} failed after ${maxRetries + 1} attempts: ${error.message}`,
        correlationId,
        details: {
            operation: context.operation,
            tenantId: context.tenantId,
            totalAttempts: maxRetries + 1,
            finalError: error.message,
            errorStack: error.stack,
            timestamp: new Date().toISOString(),
        },
    });
}
