import { NextRequest, NextResponse } from 'next/server';
import { ObservabilityService } from '../observability-service';
import crypto from 'crypto';

/**
 * PerformanceSLAInterceptor - High-order function for API Routes.
 * Automatiza la medición de performance y detección de violaciones de SLA.
 * Phase 132.4
 */
export function withPerformanceSLA(
    handler: (req: NextRequest, context: any) => Promise<NextResponse>,
    config: {
        endpoint: string;
        thresholdMs: number;
        source?: string;
    }
) {
    return async (req: NextRequest, context: any) => {
        const start = Date.now();
        const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
        // Inyectar correlationId en los headers de la request si no existe para que los servicios lo usen
        if (!req.headers.has('x-correlation-id')) {
            req.headers.set('x-correlation-id', correlationId);
        }

        try {
            const response = await handler(req, context);

            const duration = Date.now() - start;

            // ⚡ Registro asíncrono de SLA (no bloqueante para la respuesta)
            const tenantId = req.headers.get('x-tenant-id') || 'SYSTEM';

            // Usar setImmediate o Promise.resolve().then para no demorar el response final
            Promise.resolve().then(() => {
                ObservabilityService.trackSLAViolation(
                    tenantId,
                    config.endpoint,
                    duration,
                    config.thresholdMs,
                    correlationId
                );
            });

            // Añadir header de performance para transparencia (opcional, útil para debug)
            response.headers.set('x-performance-ms', duration.toString());
            response.headers.set('x-correlation-id', correlationId);

            return response;
        } catch (error) {
            const duration = Date.now() - start;
            const tenantId = req.headers.get('x-tenant-id') || 'SYSTEM';

            // Incluso en error, tracking de performance
            Promise.resolve().then(() => {
                ObservabilityService.trackSLAViolation(
                    tenantId,
                    config.endpoint,
                    duration,
                    config.thresholdMs,
                    correlationId
                );
            });

            throw error;
        }
    };
}
