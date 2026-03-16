import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CausalImpactService } from '@/services/core/causal-impact-service';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

const RequestSchema = z.object({
    finding: z.string().min(1),
    context: z.string().optional()
});

/**
 * POST /api/intelligence/causal-analysis
 * Endpoint para simulación de impacto causal (Fase 86).
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_CAUSAL', action: 'ASSESS_IMPACT' },
        async (log, correlationId) => {
            const start = Date.now();
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
                return handleApiError(error, 'API_CAUSAL_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/intelligence/causal-analysis', thresholdMs: 1000 });
