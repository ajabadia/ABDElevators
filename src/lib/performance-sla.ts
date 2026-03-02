import { NextRequest, NextResponse } from 'next/server';
import { logEvento } from './logger';
import crypto from 'crypto';

interface SLARequirements {
    p95: number;
    max: number;
}

/**
 * ⚡ withPerformanceSLA
 * HOF to wrap API Route Handlers and monitor performance against SLAs (Era 8).
 */
export function withPerformanceSLA(
    handler: (req: NextRequest, context: any) => Promise<NextResponse>,
    sla: SLARequirements
) {
    return async (req: NextRequest, context: any) => {
        const start = Date.now();
        const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();

        try {
            const response = await handler(req, context);
            const duration = Date.now() - start;

            if (duration > sla.max) {
                await logEvento({
                    level: 'WARN',
                    source: 'PERFORMANCE_SLA',
                    action: 'SLA_BREACH',
                    message: `Endpoint ${req.nextUrl.pathname} breached MAX SLA: ${duration}ms > ${sla.max}ms`,
                    correlationId,
                    details: { duration, p95_sla: sla.p95, max_sla: sla.max, method: req.method }
                });
            } else if (duration > sla.p95) {
                await logEvento({
                    level: 'INFO',
                    source: 'PERFORMANCE_SLA',
                    action: 'SLA_P95_EXCEEDED',
                    message: `Endpoint ${req.nextUrl.pathname} exceeded P95 SLA: ${duration}ms > ${sla.p95}ms`,
                    correlationId,
                    details: { duration, p95_sla: sla.p95, max_sla: sla.max, method: req.method }
                });
            }

            return response;
        } catch (error) {
            const duration = Date.now() - start;
            await logEvento({
                level: 'ERROR',
                source: 'PERFORMANCE_SLA',
                action: 'ENDPOINT_ERROR',
                message: `Error in ${req.nextUrl.pathname} after ${duration}ms`,
                correlationId,
                details: { duration, method: req.method, error: error instanceof Error ? error.message : String(error) }
            });
            throw error; // Re-throw to handleApiError in the handler
        }
    };
}
