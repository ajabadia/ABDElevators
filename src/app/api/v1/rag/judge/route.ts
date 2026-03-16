import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { RagJudgeService } from '@/services/core/rag-judge-service';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { handleApiError } from '@/lib/errors';

const JudgeSchema = z.object({
    query: z.string().min(1),
    context: z.string().min(1),
    response: z.string().min(1),
    industry: z.string().default('ELEVATORS'),
    tenantId: z.string().optional()
});

async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_RAG_JUDGE', action: 'EVALUATE_RESPONSE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('rag:eval', 'read');

                const body = await req.json();
                const validated = JudgeSchema.parse(body);
                const { query, context, response, industry } = validated;
                const tenantId = validated.tenantId || session.user.tenantId || 'global';

                const evaluation = await RagJudgeService.evaluateResponse(
                    query,
                    context,
                    response,
                    industry,
                    tenantId,
                    correlationId
                );

                await log({
                    message: 'RAG response evaluation processed',
                    details: { 
                        query: query.substring(0, 50),
                        metrics: evaluation.metrics,
                        judge_model: evaluation.judge_model
                    },
                    tenantId
                });

                return NextResponse.json({
                    success: true,
                    evaluation,
                    correlationId
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_RAG_JUDGE_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/v1/rag/judge', thresholdMs: 3000 });
