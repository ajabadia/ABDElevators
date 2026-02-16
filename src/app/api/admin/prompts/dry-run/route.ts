
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { callGeminiMini } from '@/lib/llm';
import { logEvento } from '@/lib/logger';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const DryRunSchema = z.object({
    prompt: z.string().min(1),
    testInput: z.string().optional(), // Optional context/text to test against
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
        const body = DryRunSchema.parse(json);
        const tenantId = session.user.tenantId || 'default';

        const start = Date.now();

        // Construct the full prompt if test input is provided
        let finalPrompt = body.prompt;
        if (body.testInput) {
            finalPrompt = `${body.prompt}\n\n--- TEST INPUT ---\n${body.testInput}`;
        }

        const response = await callGeminiMini(
            finalPrompt,
            tenantId,
            {
                correlationId,
                temperature: body.temperature ?? 0.7,
                model: body.model
            },
            session
        );

        const duration = Date.now() - start;

        await logEvento({
            level: 'INFO',
            source: 'ADMIN_API',
            action: 'PROMPT_DRY_RUN',
            message: 'Dry run executed successfully',
            correlationId,
            tenantId,
            details: { duration, model: body.model }
        });

        return NextResponse.json({
            success: true,
            result: response,
            metrics: {
                durationMs: duration,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[DRY RUN ERROR]', error);
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify({ error: 'Validation Failed', details: error.errors }), { status: 400 });
        }
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
});
