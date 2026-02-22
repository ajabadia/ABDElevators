
import { logEvento } from '@/lib/logger';

export interface LLMRetryOptions {
    maxRetries?: number;
    initialDelayMs?: number;
    backoffMultiplier?: number;
    timeoutMs?: number;
    correlationId?: string;
}

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
            const result = await Promise.race([
                fn(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('LLM operation timeout')), timeoutMs)
                ),
            ]);

            if (attempt > 0) {
                await logRetrySuccess(context, attempt, correlationId);
            }

            return result;
        } catch (error) {
            lastError = error as Error;
            await logRetryAttempt(context, attempt, maxRetries, lastError, correlationId);

            if (attempt === maxRetries) {
                await logRetryExhausted(context, maxRetries, lastError, correlationId);
                throw lastError;
            }

            const delay = calculateDelay(attempt, initialDelayMs, backoffMultiplier, lastError);

            if (delay > 10000) {
                await logEvento({
                    level: 'WARN',
                    source: 'LLM_RETRY',
                    action: 'QUOTA_BACKOFF',
                    message: `Backing off for ${Math.round(delay / 1000)}s due to Quota/RateLimit.`,
                    correlationId,
                    details: { delayMs: delay }
                });
            }

            await sleep(delay);
        }
    }

    throw lastError!;
}

function calculateDelay(attempt: number, initialDelayMs: number, multiplier: number, error?: Error): number {
    const isQuota = error?.message?.includes('429') ||
        error?.message?.includes('Quota') ||
        error?.message?.includes('Too Many Requests');

    if (isQuota) {
        const baseQuotaDelay = 30000;
        return baseQuotaDelay * Math.pow(2, attempt);
    }

    const exponentialDelay = initialDelayMs * Math.pow(multiplier, attempt);
    const jitter = Math.random() * 0.3 * exponentialDelay;
    return Math.floor(exponentialDelay + jitter);
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

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
            timestamp: new Date().toISOString(),
        },
    });
}

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
            timestamp: new Date().toISOString(),
        },
    });
}
