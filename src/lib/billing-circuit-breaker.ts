"use client"; // Note: This will be used in server context mostly, but if used in client we need caution. 
// Actually lib/redis.ts is server-side friendly. Let's make it server-only by convention.

import { redis } from './redis';
import { logEvento } from './logger';
import { ExternalServiceError } from './errors';

const FAILURE_THRESHOLD = 5;
const RECOVERY_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
const REDIS_KEY_FAILURES = 'billing:circuit:failures';
const REDIS_KEY_STATE = 'billing:circuit:state';
const REDIS_KEY_OPENED_AT = 'billing:circuit:opened_at';

export class BillingCircuitBreaker {
    /**
     * Verifica si el circuito está abierto (bloqueado).
     * @throws ExternalServiceError si el circuito está abierto y no ha expirado.
     */
    static async checkCircuit(): Promise<void> {
        const state = await redis.get(REDIS_KEY_STATE) as string | null;

        if (state === 'OPEN') {
            const openedAt = await redis.get(REDIS_KEY_OPENED_AT) as number | null;
            const now = Date.now();

            if (openedAt && (now - openedAt) < RECOVERY_TIMEOUT_MS) {
                const remainingMinutes = Math.ceil((RECOVERY_TIMEOUT_MS - (now - openedAt)) / 60000);

                await logEvento({
                    level: 'WARN',
                    source: 'BILLING_CIRCUIT',
                    action: 'BLOCK_REQUEST',
                    message: `Solicitud de facturación bloqueada. Circuito ABIERTO. Reintento en ${remainingMinutes} min.`,
                    correlationId: 'circuit-breaker'
                });

                throw new ExternalServiceError(
                    `El servicio de facturación está temporalmente deshabilitado debido a fallos continuos. Reintente en ${remainingMinutes} minutos.`
                );
            } else {
                // El tiempo de recuperación ha expirado, cerramos el circuito para probar de nuevo (HALF-OPEN)
                await this.reset();
            }
        }
    }

    /**
     * Registra un fallo en el servicio.
     */
    static async recordFailure(error: any): Promise<void> {
        const failures = await redis.incr(REDIS_KEY_FAILURES);

        if (failures >= FAILURE_THRESHOLD) {
            await redis.set(REDIS_KEY_STATE, 'OPEN');
            await redis.set(REDIS_KEY_OPENED_AT, Date.now());

            await logEvento({
                level: 'ERROR',
                source: 'BILLING_CIRCUIT',
                action: 'CIRCUIT_OPENED',
                message: `CIRCUITO DE FACTURACIÓN ABIERTO tras ${failures} fallos consecutivos.`,
                details: { lastError: error.message || error },
                correlationId: 'circuit-breaker'
            });
        }
    }

    /**
     * Registra un éxito en el servicio, reseteando los fallos.
     */
    static async recordSuccess(): Promise<void> {
        const failures = await redis.get(REDIS_KEY_FAILURES) as number | null;
        if (failures && failures > 0) {
            await this.reset();
        }
    }

    /**
     * Reinicia el estado del circuito.
     */
    static async reset(): Promise<void> {
        await Promise.all([
            redis.del(REDIS_KEY_FAILURES),
            redis.del(REDIS_KEY_STATE),
            redis.del(REDIS_KEY_OPENED_AT)
        ]);

        await logEvento({
            level: 'INFO',
            source: 'BILLING_CIRCUIT',
            action: 'CIRCUIT_CLOSED',
            message: 'Circuito de facturación cerrado. Servicio restaurado.',
            correlationId: 'circuit-breaker'
        });
    }
}
