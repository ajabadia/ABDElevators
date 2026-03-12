



/**
 * 🔗 Correlation ID Service
 * Purpose: Centralize the generation and management of correlation IDs for distributed tracing.
 * Implements Rule #4 (Structured Logging).
 */
export class CorrelationIdService {
    /**
     * Generates a new Correlation ID (UUID v4).
     * @param source - Optional prefix to identify the origin (e.g., 'BILLING', 'GDPR', 'INGEST')
     */
    static generate(source?: string): string {
        const uuid = globalThis.crypto.randomUUID();

        return source ? `${source.toUpperCase()}-${uuid}` : uuid;
    }

    /**
     * Attempts to get the Correlation ID from request headers, or generates a new one.
     */
    static fromRequest(req: Request): string {
        const id = req.headers.get('x-correlation-id');
        return id || this.generate();
    }
}
