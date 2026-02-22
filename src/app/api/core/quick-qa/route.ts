import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callGeminiStream } from '@/lib/llm';
import { AppError, ValidationError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { logEvento } from '@/lib/logger';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';
import { PromptService } from '@/lib/prompt-service';
import { SSEHelper } from '@/lib/sse-helper';
import crypto from 'crypto';

const QuickQASchema = z.object({
    snippet: z.string().min(1).max(50000), // Max 50KB/tokens for ephemeral
    context: z.string().optional(),
    question: z.string().min(1).max(2000),
});

/**
 * 🧠 Quick Q&A (Ephemeral Mode) API
 * Allows fast questioning on pasted text without persistence.
 */
export async function POST(req: NextRequest) {
    const start = Date.now();
    const correlationId = crypto.randomUUID();

    try {
        // 1. Auth & Permissions
        const session = await enforcePermission('knowledge', 'read');

        // 2. Rate Limiting
        const { success } = await checkRateLimit(session.user.id, LIMITS.CORE);
        if (!success) {
            throw new AppError('FORBIDDEN', 429, 'Demasiadas solicitudes. Por favor, espera un poco.');
        }

        // 3. Validation
        const body = await req.json();
        const validated = QuickQASchema.parse(body);

        await logEvento({
            level: 'INFO',
            source: 'API_QUICK_QA',
            action: 'START',
            message: `Quick Q & A request for user ${session.user.id}`,
            correlationId,
            tenantId: session.user.tenantId
        });

        // 3. Get Prompt from Governance Service (Regla de Oro #4)
        const { text: systemPromptText } = await PromptService.getRenderedPrompt(
            'QUICK_QA_EPHEMERAL',
            {
                snippet: validated.snippet,
                context: validated.context || "No context provided",
                question: validated.question
            },
            session.user.tenantId,
            'PRODUCTION',
            'GENERIC',
            session
        );

        // 4. Call Gemini with Stream (Streaming)
        const geminiStream = await callGeminiStream(systemPromptText, session.user.tenantId, {
            correlationId,
            temperature: 0.2, // More precise for technical snippets
            model
        });

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of geminiStream) {
                        const text = chunk.text();
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })} \n\n`));
                    }
                    controller.close();
                } catch (e) {
                    controller.error(e);
                }
            }
        });

        const streamWithHeartbeat = SSEHelper.wrapWithHeartbeat(stream);

        const response = new Response(streamWithHeartbeat, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

        const duration = Date.now() - start;
        if (duration > 2000) {
            await logEvento({
                level: 'WARN',
                source: 'API_QUICK_QA',
                action: 'SLA_VIOLATION',
                message: `Quick Q & A lento: ${duration} ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }

        return response;

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: 'Validación fallida', details: error.issues }, { status: 400 });
        }
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, code: error.code, message: error.message }, { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_QUICK_QA',
            action: 'UNHANDLED_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
