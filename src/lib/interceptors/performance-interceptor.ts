import { NextRequest, NextResponse } from 'next/server';
import { LoggingService as ObservabilityService } from '@/services/observability/LoggingService';

/**
 * PerformanceSLAInterceptor - High-order function for API Routes.
 * Automatiza la medición de performance y detección de violaciones de SLA.
 * Phase 132.4
 */
export function withPerformanceSLA<T = any>(
    handler: (req: NextRequest, context: T) => Promise<Response | NextResponse>,
    config: {
        endpoint: string;
        thresholdMs: number;
        source?: string;
    }
) {
    return async (req: NextRequest, context: T) => {
        const start = Date.now();
        // Use global crypto for randomUUID (Edge Runtime compatible)
        const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();

        // Ensure correlationId is available in headers for downstream services
        const modifiedHeaders = new Headers(req.headers);
        if (!modifiedHeaders.has('x-correlation-id')) {
            modifiedHeaders.set('x-correlation-id', correlationId);
        }

        try {
            const response = await handler(req, context);
            const duration = Date.now() - start;

            // ⚡ Non-blocking SLA tracking
            const tenantId = req.headers.get('x-tenant-id') || 'SYSTEM';

            // Use Promise.resolve().then to avoid delaying the response
            Promise.resolve().then(async () => {
                try {
                    await ObservabilityService.trackSLAViolation(
                        tenantId,
                        config.endpoint,
                        duration,
                        config.thresholdMs,
                        correlationId
                    );
                } catch (e) {
                    console.error('Failed to track SLA violation:', e);
                }
            });

            // Add performance headers for transparency
            if (response && response.headers) {
                response.headers.set('x-performance-ms', duration.toString());
                response.headers.set('x-correlation-id', correlationId);
            }

            return response;
        } catch (error) {
            const duration = Date.now() - start;
            const tenantId = req.headers.get('x-tenant-id') || 'SYSTEM';

            // Track performance even on failure
            Promise.resolve().then(async () => {
                try {
                    await ObservabilityService.trackSLAViolation(
                        tenantId,
                        config.endpoint,
                        duration,
                        config.thresholdMs,
                        correlationId
                    );
                } catch (e) {
                    console.error('Failed to track SLA violation (error path):', e);
                }
            });

            throw error;
        }
    };
}
