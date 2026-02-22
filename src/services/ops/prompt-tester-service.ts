import { z } from 'zod';
import { PromptService } from '@/lib/prompt-service';
import { callGeminiMini, callGeminiPro } from '@/lib/llm';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { AI_MODEL_IDS } from '@abd/platform-core';

export const PromptTestSchema = z.object({
    promptId: z.string().optional(),
    template: z.string().min(1),
    templateB: z.string().optional(), // Para A/B testing
    variables: z.record(z.string(), z.any()),
    tenantId: z.string(),
    industry: z.string(),
    model: z.enum([AI_MODEL_IDS.GEMINI_2_5_FLASH, AI_MODEL_IDS.GEMINI_2_5_PRO, AI_MODEL_IDS.GEMINI_3_PRO_PREVIEW]).default(AI_MODEL_IDS.GEMINI_2_5_FLASH),
    modelB: z.enum([AI_MODEL_IDS.GEMINI_2_5_FLASH, AI_MODEL_IDS.GEMINI_2_5_PRO, AI_MODEL_IDS.GEMINI_3_PRO_PREVIEW]).optional(), // Para A/B testing
    correlationId: z.string()
});

export type PromptTestInput = z.infer<typeof PromptTestSchema>;

export interface PromptTestResult {
    output: string;
    durationMs: number;
    tokens: number;
    model: string;
    timestamp: string;
}

/**
 * Service for executing "dry-run" prompt tests without side effects.
 */
export class PromptTesterService {
    /**
     * Run a simulation of a prompt execution.
     */
    static async runSimulation(input: PromptTestInput): Promise<PromptTestResult> {
        const start = Date.now();
        const { template, variables, tenantId, model, correlationId } = PromptTestSchema.parse(input);

        try {
            // 1. Render the prompt manually (simulating PromptService behavior)
            let renderedPrompt = template;
            for (const [key, value] of Object.entries(variables)) {
                const placeholder = `{{${key}}}`;
                renderedPrompt = renderedPrompt.split(placeholder).join(String(value));
            }

            // 2. Execute with the selected model
            const callFn = model === AI_MODEL_IDS.GEMINI_2_5_PRO || model === AI_MODEL_IDS.GEMINI_3_PRO_PREVIEW ? callGeminiPro : callGeminiMini;
            const output = await callFn(renderedPrompt, tenantId, {
                correlationId,
                model,
                temperature: 0.2 // Low temperature for deterministic dry-runs
            });

            const durationMs = Date.now() - start;

            // 3. Log event
            await logEvento({
                level: 'INFO',
                source: 'PROMPT_TESTER',
                action: 'RUN_SIMULATION',
                message: `Simulación de prompt completada (${model})`,
                correlationId,
                tenantId,
                details: { durationMs, promptLength: renderedPrompt.length }
            });

            return {
                output,
                durationMs,
                tokens: Math.ceil(renderedPrompt.length / 4 + output.length / 4), // Approximation
                model,
                timestamp: new Date().toISOString()
            };

        } catch (error: any) {
            await logEvento({
                level: 'ERROR',
                source: 'PROMPT_TESTER',
                action: 'SIMULATION_ERROR',
                message: `Error en simulación: ${error.message}`,
                correlationId,
                tenantId,
                stack: error.stack
            });
            throw new AppError('INTERNAL_ERROR', 500, error.message);
        }
    }

    /**
     * Run two simulations in parallel for comparison.
     */
    static async runComparison(input: PromptTestInput): Promise<{
        resultA: PromptTestResult;
        resultB: PromptTestResult;
    }> {
        const { template, templateB, model, modelB, variables, tenantId, industry, correlationId } = PromptTestSchema.parse(input);

        // Si no hay templateB, comparamos mismo template con modeloB (si existe)
        const finalTemplateB = templateB || template;
        const finalModelB = modelB || model;

        const [resultA, resultB] = await Promise.all([
            this.runSimulation({
                template,
                variables,
                tenantId,
                industry,
                model,
                correlationId: `${correlationId}_A`
            }),
            this.runSimulation({
                template: finalTemplateB,
                variables,
                tenantId,
                industry,
                model: finalModelB,
                correlationId: `${correlationId}_B`
            })
        ]);

        return { resultA, resultB };
    }
}
