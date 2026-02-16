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
 * Resiliencia Operativa: Gestión de fallos en servicios externos.
 * Fase 71: Escalabilidad & Resiliencia Operativa.
 */

// 1. Política de Reintento con Backoff Exponencial
const retryPolicy = retry(handleAll, {
    maxAttempts: 3,
    backoff: new ExponentialBackoff({
        initialDelay: 500,
        maxDelay: 5000,
    })
});

// 2. Circuit Breaker para Gemini API
// Se abre si el 50% de las peticiones fallan en un periodo de 20 segundos
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

// Registro de eventos para monitoreo operativo
geminiCircuitBreaker.onStateChange((state: any) => {
    logEvento({
        level: state === CircuitState.Open ? 'ERROR' : 'WARN',
        source: 'RESILIENCE_ENGINE',
        action: 'CIRCUIT_BREAKER_CHANGE',
        message: `Circuit Breaker para Gemini cambió a estado: ${state}`,
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
                message: `La operación excedió el tiempo límite programado (30s)`,
                correlationId,
                tenantId
            });
        }

        // Loguear el fallo de resiliencia final
        await logEvento({
            level: 'ERROR',
            source,
            action: `${action}_RESILIENCE_FAILURE`,
            message: `Fallo crítico tras aplicar políticas de resiliencia: ${(error as Error).message}`,
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
