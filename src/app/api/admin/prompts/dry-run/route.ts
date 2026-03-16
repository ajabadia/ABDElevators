import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { callGeminiMini } from '@/services/llm/llm-service';
import { handleApiError, ValidationError } from '@/lib/errors';
import { z } from 'zod';
import { withCorrelation } from '@/lib/logger/with-correlation';

const DryRunSchema = z.object({
    prompt: z.string().min(1),
    testInput: z.string().optional(), // Optional context/text to test against
    model: z.string().optional(),
    temperature: z.number().min(0).max(1).optional()
});

async function POST_internal (req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_PROMPT_DRYRUN', action: 'EXECUTE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('prompt', 'manage');
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

                await log({
                    message: 'Dry run executed successfully',
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
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/prompts/dry-run', thresholdMs: 1000 });
