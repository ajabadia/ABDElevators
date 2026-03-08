import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callGeminiStream } from '@/services/llm/llm-service';
import { AppError, ValidationError, handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';
import { PromptService } from '@/services/llm/prompt-service';
import { SSEHelper } from '@/lib/sse-helper';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';

const QuickQASchema = z.object({
    snippet: z.string().min(1).max(50000), // Max 50KB/tokens for ephemeral
    context: z.string().optional(),
    question: z.string().min(1).max(2000),
});

/**
 * 🧠 Quick Q&A (Ephemeral Mode) API
 * Allows fast questioning on pasted text without persistence.
 * SLA: P95 < 2000ms
 */
export const POST = withPerformanceSLA(async (req: NextRequest) => {
    const correlationId = crypto.randomUUID();

    try {
        // 1. Auth & Permissions
        const session = await requirePermission('knowledge', 'read');

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

        // 4. Get Prompt from Governance Service (Regla de Oro #4)
        const { text: systemPromptText, model } = await PromptService.getRenderedPrompt(
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

        // 5. Call Gemini with Stream (Streaming)
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

        // Cast needed because Response !== NextResponse natively for TypeScript in this context
        return response as unknown as NextResponse;

    } catch (error: unknown) {
        return handleApiError(error, 'API_QUICK_QA_POST', correlationId);
    }
}, { endpoint: 'POST /api/core/quick-qa', thresholdMs: 2000 });
