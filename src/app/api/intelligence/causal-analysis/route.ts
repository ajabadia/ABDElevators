import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CausalImpactService } from '@/services/core/causal-impact-service';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';

const RequestSchema = z.object({
    finding: z.string().min(1),
    context: z.string().optional()
});

/**
 * POST /api/intelligence/causal-analysis
 * Endpoint para simulación de impacto causal (Fase 86).
 */
export async function POST(req: Request) {
    const start = Date.now();
    const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();

    try {
        const body = await req.json();
        const { finding, context } = RequestSchema.parse(body);

        // En un entorno multi-tenant real, sacaríamos el tenantId de la sesión
        // Para desarrollo/demo (Fase 86), usamos el tenantId configurado.
        const tenantId = process.env.SINGLE_TENANT_ID || 'demo-tenant';

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

    } catch (error: any) {
        const duration = Date.now() - start;
        const isAppError = error instanceof AppError || error?.name === 'AppError';

        // Log early
        await logEvento({
            level: 'ERROR',
            source: 'API_CAUSAL',
            action: 'RAISED_ERROR',
            message: error.message || 'Error in simulation',
            correlationId,
            details: {
                isAppError,
                errorCode: error.code,
                errorName: error.name,
                duration
            },
            stack: error.stack
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

        if (isAppError) {
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
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            __DEBUG_ID: 'CAUSAL_ROUTE_V2'
        }, {
            status: 500,
            headers: { 'x-debug-origin': 'CAUSAL_API_V2' }
        });
    }
}
