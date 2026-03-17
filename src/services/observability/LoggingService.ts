import { EventSchema, AppEvent } from './schemas/EventSchema';
import { CorrelationIdService } from './CorrelationIdService';

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
     * 🚀 Optimized: Early exits and faster regex handling.
     */
    private static maskPII(value: unknown, depth = 0): unknown {
        if (depth > 5) return "[DEPTH_EXCEEDED]"; // 🛡️ Prevent stack overflow/extreme latency
        if (typeof value !== 'string' && (typeof value !== 'object' || value === null)) return value;

        if (typeof value === 'string') {
            if (!value.includes('@') && !/\d/.test(value)) return value; // Early exit for non-PII strings
            return value
                .replace(/([^@\s]{1,3})[^@\s]*@([^@\s]+\.[^@\s]+)/g, '$1***@$2')
                .replace(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.)\d{1,3}/g, '$1xxx');
        }

        if (Array.isArray(value)) {
            return value.map(item => this.maskPII(item, depth + 1));
        }

        // Handle objects using reduce for a more functional approach
        if (typeof value === 'object' && value !== null) {
            return Object.keys(value as Record<string, unknown>).reduce((acc: Record<string, unknown>, key) => {
                // Skip masking for known safe keys or large blobs
                if (key === 'stack' || key === 'error_id') {
                    acc[key] = (value as Record<string, unknown>)[key];
                } else {
                    acc[key] = this.maskPII((value as Record<string, unknown>)[key], depth + 1);
                }
                return acc;
            }, {});
        }
        return value; // Fallback for any other unhandled types, though previous checks should cover most
    }

    /**
     * Standard log entry.
     */
    static async log(event: Partial<AppEvent> & { level: AppEvent['level'], source: string, action: string, message: string }) {
        const eventLevel = this.LOG_LEVELS[event.level] ?? 0;
        if (eventLevel < this.getMinLogLevel()) return;

        const correlationId = event.correlationId || CorrelationIdService.generate();

        // 🚀 Optimization: Process PII masking only if level > DEBUG to save cycles in high-traffic trace
        const shouldMask = event.level !== 'DEBUG';

        const normalized: AppEvent = {
            ...event,
            message: (shouldMask ? this.maskPII(event.message) : event.message) as string,
            userEmail: (event.userEmail && shouldMask ? this.maskPII(event.userEmail) : event.userEmail) as string | undefined,
            details: (event.details && shouldMask ? this.maskPII(event.details) : event.details) as Record<string, unknown> | undefined,
            correlationId,
            timestamp: new Date()
        };



        const validated = EventSchema.parse(normalized);

        if (process.env.NEXT_RUNTIME === 'edge') {
            console.log(`[EDGE_LOG][${validated.level}][${validated.source}][${validated.action}] ${validated.message}`);
            return;
        }

        // ⚡ Non-blocking log save for low priority levels
        const isCritical = validated.level === 'ERROR' || validated.level === 'WARN';
        const savePromise = (async () => {
            try {
                const { ObservabilityRepository } = await import('./ObservabilityRepository');
                await ObservabilityRepository.saveLog(validated as AppEvent);
            } catch (error) {
                console.error('Failed to save log:', error);
            }
        })();

        if (isCritical) await savePromise;
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
            details: {
                message: err?.message || String(error),
                stack: err?.stack
            },
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
