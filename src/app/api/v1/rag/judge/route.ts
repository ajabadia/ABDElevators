import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { RagJudgeService } from '@/services/core/rag-judge-service';
import { z } from 'zod';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { generateUUID } from '@/lib/utils';
import { requirePermission } from '@/lib/auth';

const JudgeSchema = z.object({
    query: z.string().min(1),
    context: z.string().min(1),
    response: z.string().min(1),
    industry: z.string().default('ELEVATORS'),
    tenantId: z.string().optional()
});

async function POST_internal(req: NextRequest) {
    const correlationId = generateUUID();
    const startTime = Date.now();

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

        const duration = Date.now() - startTime;
        await logEvento({
            level: 'INFO',
            source: 'API_RAG_JUDGE',
            action: 'EVALUATE_RESPONSE',
            message: 'RAG response evaluation processed',
            correlationId,
            tenantId,
            details: { duration_ms: duration, query: query.substring(0, 50) }
        });

        return NextResponse.json({
            success: true,
            evaluation,
            correlationId
        });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: 'VALIDATION_ERROR', details: error.issues }, { status: 400 });
        }

        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[API JUDGE ERROR]', error);

        return NextResponse.json({
            success: false,
            error: 'INTERNAL_ERROR',
            message,
            correlationId
        }, { status: 500 });
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/v1/rag/judge', thresholdMs: 1000 });
