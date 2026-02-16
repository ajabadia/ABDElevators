import { NextRequest, NextResponse } from 'next/server';
import { RagJudgeService } from '@/services/rag-judge-service';
import { z } from 'zod';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { generateUUID } from '@/lib/utils';

const JudgeSchema = z.object({
    query: z.string().min(1),
    context: z.string().min(1),
    response: z.string().min(1),
    industry: z.string().default('ELEVATORS'),
    tenantId: z.string().optional()
});

export async function POST(req: NextRequest) {
    const correlationId = generateUUID();
    const inicio = Date.now();

    try {
        const body = await req.json();
        const validated = JudgeSchema.parse(body);
        const { query, context, response, industry } = validated;
        const tenantId = validated.tenantId || 'global';

        const evaluation = await RagJudgeService.evaluateResponse(
            query,
            context,
            response,
            industry,
            tenantId,
            correlationId
        );

        const duracion = Date.now() - inicio;
        await logEvento({
            level: 'INFO',
            source: 'API_RAG_JUDGE',
            action: 'EVALUATE_RESPONSE',
            message: 'Evaluación de respuesta RAG procesada',
            correlationId,
            tenantId,
            details: { duracion_ms: duracion, query: query.substring(0, 50) }
        });

        return NextResponse.json({
            success: true,
            evaluation,
            correlationId
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: 'VALIDATION_ERROR', details: (error as any).errors }, { status: 400 });
        }
        console.error('[API JUDGE ERROR]', error);
        return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
    }
}
