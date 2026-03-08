import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CausalImpactService } from '@/services/core/causal-impact-service';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
const RequestSchema = z.object({
    finding: z.string().min(1),
    context: z.string().optional()
});

/**
 * POST /api/intelligence/causal-analysis
 * Endpoint para simulación de impacto causal (Fase 86).
 */
async function POST_internal(req: NextRequest) {
    const start = Date.now();
    const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();

    try {
        const session = await requirePermission('analysis', 'read');
        const tenantId = session.user.tenantId;

        const body = await req.json();
        const { finding, context } = RequestSchema.parse(body);

        const analysis = await CausalImpactService.assessImpact(
            finding,
            context || 'Sin contexto adicional',
            tenantId
        );

        const duration = Date.now() - start;

        return NextResponse.json({
            success: true,
            analysis,
            meta: {
                duration_ms: duration,
                correlationId,
                tenantId,
                __DEBUG_ID: 'CAUSAL_ROUTE_V2'
            }
        }, {
            headers: { 'x-debug-origin': 'CAUSAL_API_V2' }
        });

    } catch (error: unknown) {
        const duration = Date.now() - start;

        // Log early
        await logEvento({
            level: 'ERROR',
            source: 'API_CAUSAL',
            action: 'RAISED_ERROR',
            message: error instanceof Error ? error.message : 'Error in simulation',
            correlationId,
            details: {
                duration,
                stack: error instanceof Error ? error.stack : undefined
            }
        });

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                error: 'VALIDATION_ERROR',
                details: error.issues,
                __DEBUG_ID: 'CAUSAL_ROUTE_V2'
            }, {
                status: 400,
                headers: { 'x-debug-origin': 'CAUSAL_API_V2' }
            });
        }

        if (error instanceof AppError) {
            return NextResponse.json({
                success: false,
                error: error.code || 'APP_ERROR',
                message: error.message,
                details: error.details,
                __DEBUG_ID: 'CAUSAL_ROUTE_V2'
            }, {
                status: error.status || 500,
                headers: { 'x-debug-origin': 'CAUSAL_API_V2' }
            });
        }

        return NextResponse.json({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
            __DEBUG_ID: 'CAUSAL_ROUTE_V2'
        }, {
            status: 500,
            headers: { 'x-debug-origin': 'CAUSAL_API_V2' }
        });
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/intelligence/causal-analysis', thresholdMs: 1000 });
