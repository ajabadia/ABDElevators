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

// 1. Política de Reintento con Backoff Exponencial
const retryPolicy = retry(handleAll, {
    maxAttempts: 3,
    backoff: new ExponentialBackoff({
        initialDelay: 2000,
        maxDelay: 5000,
    })
});

// 2. Circuit Breaker for Gemini API
// Opens if 50% of requests fail within a 20-second window
const geminiCircuitBreaker = circuitBreaker(handleAll, {
    halfOpenAfter: 10 * 1000,
    breaker: new SamplingBreaker({
        threshold: 0.5,
        duration: 20 * 1000,
        minimumRps: 1,
    })
});

// 3. Bulkhead para limitar concurrencia
const geminiBulkhead = bulkhead(10, 5);

// 4. Timeout estricto de 30 segundos
const geminiTimeout = timeout(30000, TimeoutStrategy.Aggressive);

// Event registration for operational monitoring
geminiCircuitBreaker.onStateChange((state: any) => {
    logEvento({
        level: state === CircuitState.Open ? 'ERROR' : 'WARN',
        source: 'RESILIENCE_ENGINE',
        action: 'CIRCUIT_BREAKER_CHANGE',
        message: `Gemini Circuit Breaker changed to state: ${state}`,
        correlationId: 'SYSTEM',
        details: { state }
    }).catch(console.error);
});

/**
 * Orquestador de Resiliencia para Gemini.
 * Aplica: Retry -> Circuit Breaker -> Bulkhead -> Timeout.
 */
export const geminiResilience = wrap(
    retryPolicy,
    geminiCircuitBreaker,
    geminiBulkhead,
    geminiTimeout
);

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
    task: (context?: any) => Promise<T>,
    correlationId: string,
    tenantId?: string
): Promise<T> {
    try {
        return await geminiResilience.execute(task);
    } catch (error) {
        if (error instanceof TaskCancelledError) {
            await logEvento({
                level: 'WARN',
                source,
                action: `${action}_TIMEOUT`,
                message: `The operation exceeded the scheduled time limit (30s)`,
                correlationId,
                tenantId
            });
        }

        // Log the final resilience failure
        await logEvento({
            level: 'ERROR',
            source,
            action: `${action}_RESILIENCE_FAILURE`,
            message: `Critical failure after applying resilience policies: ${(error as Error).message}`,
            correlationId,
            tenantId,
            details: {
                errorName: (error as Error).name,
                isCircuitOpen: geminiCircuitBreaker.state === CircuitState.Open
            }
        });

        throw error;
    }
}
