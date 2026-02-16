
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { callGeminiMini } from '@/lib/llm';
import { logEvento } from '@/lib/logger';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const ABTestSchema = z.object({
    promptA: z.string().min(1),
    promptB: z.string().min(1),
    testInput: z.string().optional(),
    model: z.string().optional(),
    temperature: z.number().min(0).max(1).optional()
});

export const POST = auth(async function POST(req) {
    const session = req.auth;
    const correlationId = uuidv4();

    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const json = await req.json();
        const body = ABTestSchema.parse(json);
        const tenantId = session.user.tenantId || 'default';

        const start = Date.now();

        const taskA = async () => {
            const tStart = Date.now();
            const res = await callGeminiMini(
                body.testInput ? `${body.promptA}\n\n--- TEST INPUT ---\n${body.testInput}` : body.promptA,
                tenantId,
                { correlationId: `${correlationId}-A`, temperature: body.temperature, model: body.model },
                session
            );
            return { result: res, duration: Date.now() - tStart };
        };

        const taskB = async () => {
            const tStart = Date.now();
            const res = await callGeminiMini(
                body.testInput ? `${body.promptB}\n\n--- TEST INPUT ---\n${body.testInput}` : body.promptB,
                tenantId,
                { correlationId: `${correlationId}-B`, temperature: body.temperature, model: body.model },
                session
            );
            return { result: res, duration: Date.now() - tStart };
        };

        const [resA, resB] = await Promise.all([taskA(), taskB()]);

        const totalDuration = Date.now() - start;

        await logEvento({
            level: 'INFO',
            source: 'ADMIN_API',
            action: 'PROMPT_AB_TEST',
            message: 'AB Test executed successfully',
            correlationId,
            tenantId,
            details: { totalDuration }
        });

        return NextResponse.json({
            success: true,
            results: {
                A: resA,
                B: resB
            },
            metrics: {
                totalDurationMs: totalDuration,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[AB TEST ERROR]', error);
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify({ error: 'Validation Failed', details: error.errors }), { status: 400 });
        }
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
});
