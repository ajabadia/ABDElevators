



/**
 * 🔗 Correlation ID Service
 * Proposito: Centralizar la generación y gestión de IDs de correlación para trazabilidad distribuida.
 * Implementa Rule #4 (Structured Logging).
 */
export class CorrelationIdService {
    /**
     * Genera un nuevo Correlation ID (UUID v4).
     * @param source - Prefijo opcional para identificar el origen (ej: 'BILLING', 'GDPR', 'INGEST')
     */
    static generate(source?: string): string {
        const uuid = globalThis.crypto.randomUUID();

        return source ? `${source.toUpperCase()}-${uuid}` : uuid;
    }

    /**
     * Intenta obtener el Correlation ID de los headers de una request, o genera uno nuevo.
     */
    static fromRequest(req: Request): string {
        const id = req.headers.get('x-correlation-id');
        return id || this.generate();
    }
}
