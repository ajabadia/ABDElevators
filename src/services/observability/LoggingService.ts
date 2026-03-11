import { EventSchema, AppEvent } from './schemas/EventSchema';

/**
 * 📝 LoggingService
 * Technical telemetry and platform visibility.
 */
export class LoggingService {

    /** Phase 302: Log level hierarchy for environment-based filtering */
    private static readonly LOG_LEVELS: Record<string, number> = {
        'DEBUG': 0, 'INFO': 1, 'WARN': 2, 'ERROR': 3
    };

    private static getMinLogLevel(): number {
        const envLevel = (process.env.LOG_LEVEL || 'DEBUG').toUpperCase();
        return this.LOG_LEVELS[envLevel] ?? 0;
    }

    /**
     * Phase 401: Mask PII (Email and IPv4)
     */
    private static maskPII(value: unknown): any {
        if (typeof value === 'string') {
            // Mask Email: u***@domain.com
            const maskedEmail = value.replace(/([^@\s]{1,3})[^@\s]*@([^@\s]+\.[^@\s]+)/g, '$1***@$2');
            // Mask IPv4: 192.168.1.xxx
            const maskedIp = maskedEmail.replace(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.)\d{1,3}/g, '$1xxx');
            return maskedIp;
        }

        if (value && typeof value === 'object') {
            const maskedObj: any = Array.isArray(value) ? [] : {};
            for (const key in value as any) {
                maskedObj[key] = this.maskPII((value as any)[key]);
            }
            return maskedObj;
        }

        return value;
    }

    /**
     * Standard log entry.
     */
    static async log(event: Partial<AppEvent> & { level: AppEvent['level'], source: string, action: string, message: string }) {
        // Phase 302: Skip events below the configured LOG_LEVEL
        const eventLevel = this.LOG_LEVELS[event.level] ?? 0;
        if (eventLevel < this.getMinLogLevel()) return;
        const normalized: AppEvent = {
            ...event,
            message: this.maskPII(event.message),
            userEmail: event.userEmail ? this.maskPII(event.userEmail) : undefined,
            details: event.details ? this.maskPII(event.details) : undefined,
            correlationId: event.correlationId || globalThis.crypto.randomUUID(),

            timestamp: new Date()
        };

        const validated = EventSchema.parse(normalized);

        // ⚡ Edge Runtime Compatibility: Avoid Node-only Repository
        if (process.env.NEXT_RUNTIME === 'edge') {
            console.log(`[EDGE_LOG][${validated.level}][${validated.source}][${validated.action}] ${validated.message}`, validated.details || '');
            return;
        }

        try {
            const { ObservabilityRepository } = await import('./ObservabilityRepository');
            await ObservabilityRepository.saveLog(validated as AppEvent);
        } catch (error) {
            console.error('Failed to save log to repository:', error);
            console.log(`[FALLBACK_LOG][${validated.level}][${validated.source}][${validated.action}] ${validated.message}`);
        }
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
            details: { thresholdMs: data.thresholdMs, endpoint: data.action }
        });
    }

    // Sugar methods
    static info(source: string, action: string, message: string, details?: unknown) {
        return this.log({ level: 'INFO', source, action, message, details: details as Record<string, unknown> });
    }

    static error(source: string, action: string, message: string, error: unknown, correlationId?: string) {
        const err = error as Error;
        return this.log({
            level: 'ERROR',
            source,
            action,
            message,
            correlationId,
            details: err?.message || String(error),
            stack: err?.stack
        });
    }

    /**
     * Higher-order function to wrap an operation with SLA tracking and error logging.
     */
    static async withSla<T>(
        source: string,
        action: string,
        thresholdMs: number,
        correlationId: string,
        fn: () => Promise<T>
    ): Promise<T> {
        const start = Date.now();
        try {
            return await fn();
        } finally {
            const durationMs = Date.now() - start;
            await this.logPerformance({
                source,
                action,
                durationMs,
                thresholdMs,
                correlationId
            });
        }
    }

    /**
     * Bridge method for SLA tracking (legacy compat).
     */
    static async trackSLAViolation(
        tenantId: string,
        action: string,
        durationMs: number,
        thresholdMs: number,
        correlationId: string
    ) {
        await this.logPerformance({
            source: 'API_INTERCEPTOR',
            action,
            durationMs,
            thresholdMs,
            tenantId,
            correlationId
        });
    }
}
