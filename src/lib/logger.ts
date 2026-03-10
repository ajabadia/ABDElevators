/**
 * ⚡ FASE 182+: Unified Observability
 * Platform-wide logging entry point.
 * Refactored in Phase 342 to prevent server-side dependencies (mongodb) 
 * from leaking into the browser bundle.
 */
export const logEvento = async (event: any) => {
    if (typeof window !== 'undefined') {
        // Client side: Send to API
        try {
            const { logEventoClient } = await import('./logger-client');
            return await logEventoClient(event);
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

export const withSla = async <T>(...args: any[]): Promise<T> => {
    if (typeof window !== 'undefined') {
        // No-op or limited functionality in client for now
        const fn = args[4];
        return await fn();
    }
    const { LoggingService } = await import('@/services/observability/LoggingService');
    // @ts-ignore - dynamic bind
    return LoggingService.withSla.apply(LoggingService, args);
};

export type { AppEvent as LogEventoParams } from '@/services/observability/schemas/EventSchema';
