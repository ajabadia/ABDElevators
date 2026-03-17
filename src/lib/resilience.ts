import {
    handleAll,
    ExponentialBackoff,
    TaskCancelledError,
    CircuitState,
    SamplingBreaker,
    TimeoutStrategy,
    wrap,
    retry,
    circuitBreaker,
    bulkhead,
    timeout
} from 'cockatiel';
import { logEvento } from './logger';

/**
 * Operational Resilience: Management of failures in external services.
 * Phase 71: Scalability & Operational Resilience.
 */

/**
 * 🛠️ Generic Resilience Policies
 */

export const createRetryPolicy = (attempts: number = 3, initialDelay: number = 2000) => retry(handleAll, {
    maxAttempts: attempts,
    backoff: new ExponentialBackoff({
        initialDelay,
        maxDelay: 10000,
    })
});

export const createCircuitBreaker = (name: string, threshold: number = 0.5) => {
    const breaker = circuitBreaker(handleAll, {
        halfOpenAfter: 15 * 1000,
        breaker: new SamplingBreaker({
            threshold,
            duration: 30 * 1000,
            minimumRps: 1,
        })
    });

    breaker.onStateChange((state: CircuitState) => {
        logEvento({
            level: state === CircuitState.Open ? 'ERROR' : 'WARN',
            source: 'RESILIENCE_ENGINE',
            action: 'CIRCUIT_BREAKER_CHANGE',
            message: `Circuit Breaker [${name}] changed to state: ${state}`,
            correlationId: 'SYSTEM',
            details: { state, service: name }
        }).catch(console.error);
    });

    return breaker;
};

export const createTimeout = (ms: number) => timeout(ms, TimeoutStrategy.Aggressive);

// 1. Specific Policy for Gemini (Legacy/Main LLM)
const geminiRetry = createRetryPolicy(3, 2000);
export const geminiCircuitBreaker = createCircuitBreaker('GEMINI', 0.5);
const geminiBulkhead = bulkhead(10, 5);
const geminiTimeout = createTimeout(30000);

export const geminiResilience = wrap(
    geminiRetry,
    geminiCircuitBreaker,
    geminiBulkhead,
    geminiTimeout
);

// 2. Specific Policy for Storage (Cloudinary/S3)
const storageRetry = createRetryPolicy(2, 1000);
export const storageCircuitBreaker = createCircuitBreaker('STORAGE', 0.6);
const storageTimeout = createTimeout(15000);

export const storageResilience = wrap(
    storageRetry,
    storageCircuitBreaker,
    storageTimeout
);

// 3. Specific Policy for Database (Heavy operations)
export const dbResilience = wrap(
    createRetryPolicy(2, 500),
    createTimeout(5000)
);

// 4. Specific Policy for PDF Extraction (Advanced Engine)
export const pdfResilience = wrap(
    createRetryPolicy(1, 1000), // Only 1 retry for PDF as it's often a heavy/expensive process
    createCircuitBreaker('PDF_EXTRACTION', 0.5),
    createTimeout(60000) // 1 minute timeout for large PDFs
);

/**
 * Gemini RPM Rate Limiter (Phase 301 — Security Audit).
 * Prevents cost overruns by enforcing a per-minute request limit.
 * Configurable via GEMINI_MAX_RPM env var (default: 60).
 */
const GEMINI_MAX_RPM = parseInt(process.env.GEMINI_MAX_RPM || '60', 10);
let geminiRpmWindowStart = Date.now();
let geminiRpmCount = 0;

/**
 * Checks if a Gemini API call is allowed under the RPM limit.
 * @returns true if allowed, false if rate-limited
 */
export function checkGeminiRateLimit(): boolean {
    const now = Date.now();
    // Reset window every 60 seconds
    if (now - geminiRpmWindowStart >= 60_000) {
        geminiRpmWindowStart = now;
        geminiRpmCount = 0;
    }
    if (geminiRpmCount >= GEMINI_MAX_RPM) {
        return false;
    }
    geminiRpmCount++;
    return true;
}

/**
 * Helper para ejecutar tareas con resiliencia y logueo estandarizado.
 */
// Variable para mantener el control de aislamiento manual
let isolationDisposable: { dispose(): void } | null = null;

/**
 * Manually resets the state of the Gemini Circuit Breaker.
 * Useful for recovery after fixing configuration errors (Phase 213).
 */
export function resetGeminiCircuitBreaker() {
    // Si ya hay un aislamiento activo, lo liberamos primero
    if (isolationDisposable) {
        isolationDisposable.dispose();
        isolationDisposable = null;
    }

    // Forzamos el cierre del circuito activando y desactivando aislamiento.
    // En cockatiel, isolate() devuelve un objeto con dispose().
    isolationDisposable = geminiCircuitBreaker.isolate();

    // The reset is almost instantaneous, we release after 100ms to ensure
    // that the breaker recognizes the state change before releasing it.
    setTimeout(async () => {
        if (isolationDisposable) {
            isolationDisposable.dispose();
            isolationDisposable = null;
            await logEvento({
                level: 'INFO',
                source: 'RESILIENCE_ENGINE',
                action: 'CIRCUIT_BREAKER_RESET',
                message: "Gemini Circuit Breaker reset completed (State closed).",
                correlationId: 'SYSTEM'
            });
        }
    }, 100);
}

export async function executeWithResilience<T>(
    source: string,
    action: string,
    task: (context?: unknown) => Promise<T>,
    correlationId: string,
    tenantId?: string,
    customPolicy?: any // Allow passing specific policies (storageResilience, etc)
): Promise<T> {
    const policy = customPolicy || geminiResilience;
    try {
        return await policy.execute(task);
    } catch (error) {
        if (error instanceof TaskCancelledError) {
            await logEvento({
                level: 'WARN',
                source,
                action: `${action}_TIMEOUT`,
                message: `The operation "${action}" in "${source}" exceeded the scheduled time limit.`,
                correlationId,
                tenantId
            });
        }

        // Log the final resilience failure if not already handled by the specific service
        if (!(error instanceof TaskCancelledError)) {
            await logEvento({
                level: 'ERROR',
                source,
                action: `${action}_RESILIENCE_FAILURE`,
                message: `Critical failure after applying resilience policies: ${(error as Error).message}`,
                correlationId,
                tenantId,
                details: {
                    errorName: (error as Error).name,
                }
            });
        }

        throw error;
    }
}
