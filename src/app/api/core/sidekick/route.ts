import { NextRequest, NextResponse } from 'next/server';
import { PromptService } from '@/services/llm/prompt-service';
import { AiModelManager } from '@/services/core/ai-model-manager';
import { SidekickContextService } from '@/services/core/SidekickContextService';
import { AIMODELIDS } from '@/lib/ai-models';
import { logEvento } from '@/lib/logger';
import { generateUUID } from '@/lib/utils';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import withCorrelation from '@/lib/logger/with-correlation';
import { handleApiError } from '@/lib/errors';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SidekickRequestSchema = z.object({
    message: z.string().min(1),
    pathname: z.string().min(1),
    contextData: z.record(z.string(), z.any()).optional().default({}),
    history: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string()
    })).optional().default([])
});

/**
 * 🛠️ Sidekick AI Assistant API
 * SLA: P95 < 2000ms
 */
export const POST = withPerformanceSLA(async (req: NextRequest) => {
    return withCorrelation(
        { level: 'INFO', source: 'API_SIDEKICK', action: 'SIDEKICK_QUERY' },
        async (log, correlationId) => {
            const start = Date.now();
            try {
                const body = await req.json();
                const validated = SidekickRequestSchema.parse(body);

                await log({
                    action: 'SIDEKICK_QUERY_START',
                    message: `Sidekick query received for path: ${validated.pathname}`,
                    details: { pathname: validated.pathname }
                });

                // 1. Resolve architectural context
                const { description, isSpecific } = SidekickContextService.resolveContext(validated.pathname);

                const historyContext = validated.history.length > 0
                    ? validated.history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')
                    : "No previous history.";

                // Convert contextData to a readable string
                const contextDataStr = Object.keys(validated.contextData).length > 0
                    ? JSON.stringify(validated.contextData, null, 2)
                    : "No specific live data provided.";

                // 2 & 3. Render prompt using Service (handles variables + model fallback safely)
                const tenantId = "GLOBAL";

                let finalPrompt: string;
                let modelStr: string;

                try {
                    const rendered = await PromptService.getRenderedPrompt(
                        'SIDEKICK_CONTEXTUAL',
                        {
                            contextDescription: description,
                            liveData: contextDataStr,
                            history: historyContext,
                            query: validated.message
                        },
                        tenantId,
                        "PRODUCTION",
                        "GENERIC"
                    );
                    finalPrompt = rendered.text;
                    modelStr = rendered.model;
                } catch (error: any) {
                    await log({
                        level: 'WARN',
                        action: 'PROMPT_SERVICE_FALLBACK',
                        message: `PromptService failed. Using hardcoded master fallback. ${error.message}`
                    });

                    const { PROMPTS } = await import('@/lib/prompts');
                    const fallback = PROMPTS.SIDEKICK_CONTEXTUAL;

                    finalPrompt = fallback.template
                        .replace('{{contextDescription}}', description)
                        .replace('{{liveData}}', contextDataStr)
                        .replace('{{history}}', historyContext)
                        .replace('{{query}}', validated.message);

                    modelStr = AIMODELIDS.SIDEKICK_CONTEXTUAL;
                }

                // 4. Determine functional model (Era 11 compliance)
                const model = genAI.getGenerativeModel({ model: modelStr });

                // 5. Generate Response
                const result = await model.generateContent(finalPrompt);
                const responseText = result.response.text();

                const duration = Date.now() - start;

                await log({
                    action: 'SIDEKICK_QUERY_SUCCESS',
                    message: `Sidekick responded in ${duration}ms`,
                    details: { isSpecific, durationMs: duration }
                });

                return NextResponse.json({
                    success: true,
                    response: responseText,
                    isSpecificContext: isSpecific
                });

            } catch (error: any) {
                return handleApiError(error, 'API_SIDEKICK', correlationId);
            }
        }
    );
}, { endpoint: 'POST /api/core/sidekick', thresholdMs: 2000 });
