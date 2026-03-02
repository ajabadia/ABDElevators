import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { callGeminiMini } from '@/services/llm/llm-service';
import { logEvento } from '@/lib/logger';
import { handleApiError, ValidationError } from '@/lib/errors';
import { z } from 'zod';

const DryRunSchema = z.object({
    prompt: z.string().min(1),
    testInput: z.string().optional(), // Optional context/text to test against
    model: z.string().optional(),
    temperature: z.number().min(0).max(1).optional()
});

async function POST_internal (req: NextRequest) {
    const correlationId = crypto.randomUUID();

    try {
        const session = await enforcePermission('prompt', 'manage');
        const tenantId = session.user.tenantId || 'default';

        const json = await req.json();
        const body = DryRunSchema.parse(json);

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
            session as any
        );

        const duration = Date.now() - start;

        await logEvento({
            level: 'INFO',
            source: 'ADMIN_API',
            action: 'PROMPT_DRY_RUN',
            message: 'Dry run executed successfully',
            correlationId,
            details: { duration_ms: duration, model: body.model }
        });

        return NextResponse.json({
            success: true,
            result: response,
            metrics: {
                durationMs: duration,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            throw new ValidationError('Validation Failed', error.issues);
        }
        return handleApiError(error, 'API_ADMIN_PROMPTS_DRY_RUN', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/prompts/dry-run', thresholdMs: 1000 });
