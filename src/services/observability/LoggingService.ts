import { EventSchema, AppEvent } from './schemas/EventSchema';
import { ObservabilityRepository } from './ObservabilityRepository';
import crypto from 'crypto';

/**
 * 📝 LoggingService
 * Technical telemetry and platform visibility.
 */
export class LoggingService {

    /**
     * Standard log entry.
     */
    static async log(event: Partial<AppEvent> & { level: AppEvent['level'], source: string, action: string, message: string }) {
        const normalized: AppEvent = {
            ...event,
            correlationId: event.correlationId || crypto.randomUUID(),
            timestamp: new Date()
        };

        const validated = EventSchema.parse(normalized);
        await ObservabilityRepository.saveLog(validated as AppEvent);
    }

    /**
     * Specialized performance logging with SLA tracking.
     */
    static async logPerformance(data: {
        source: string,
        action: string,
        durationMs: number,
        thresholdMs: number,
        tenantId?: string,
        correlationId?: string
    }) {
        const level = data.durationMs > data.thresholdMs ? 'WARN' : 'INFO';
        const message = `${data.action} took ${data.durationMs}ms (Threshold: ${data.thresholdMs}ms)`;

        await this.log({
            level,
            source: data.source,
            action: 'PERFORMANCE_METRIC',
            message,
            durationMs: data.durationMs,
            tenantId: data.tenantId,
            correlationId: data.correlationId,
            details: { thresholdMs: data.thresholdMs }
        });
    }

    // Sugar methods
    static info(source: string, action: string, message: string, details?: any) {
        return this.log({ level: 'INFO', source, action, message, details });
    }

    static error(source: string, action: string, message: string, error: any, correlationId?: string) {
        return this.log({
            level: 'ERROR',
            source,
            action,
            message,
            correlationId,
            details: error?.message || error,
            stack: error?.stack
        });
    }
}
