import { type AppEvent } from '@/services/observability/schemas/EventSchema';

/**
 * ⚡ FASE 182+: Unified Observability
 * Platform-wide logging entry point.
 */
export const logEvento = async (event: Partial<AppEvent> & {
    level: AppEvent['level'],
    source: string,
    action: string,
    message: string
}) => {
    if (typeof window !== 'undefined') {
        // Client side: Send to API
        try {
            const { logEventoClient } = await import('./logger-client');
            return await logEventoClient(event as any);
        } catch (err) {
            console.warn('Logging failed in client:', err);
        }
    } else {
        // Server side: Direct service call
        try {
            const { LoggingService } = await import('@/services/observability/LoggingService');
            return await LoggingService.log(event);
        } catch (err) {
            console.error('Logging failed in server:', err);
        }
    }
};

export const withSla = async <T>(
    source: string,
    action: string,
    thresholdMs: number,
    correlationId: string,
    fn: () => Promise<T>
): Promise<T> => {
    if (typeof window !== 'undefined') {
        return await fn();
    }
    const { LoggingService } = await import('@/services/observability/LoggingService');
    return LoggingService.withSla(source, action, thresholdMs, correlationId, fn);
};

export type { AppEvent as LogEventoParams } from '@/services/observability/schemas/EventSchema';
