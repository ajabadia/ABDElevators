import { PromptService } from '@/lib/prompt-service';
import { DEFAULT_PROMPTS } from '@/lib/prompts/core-definitions';
import { AIMODELIDS } from '@/lib/ai-models';
import { LlmJsonUtils } from '@/services/llm/json-utils';
import { logEvento } from '@/lib/logger';
import { CorrelationIdService } from '@/services/observability/CorrelationIdService';

/**
 * 🧠 Legacy Prompt Runner (Era 6)
 * @deprecated Use PromptRunner from @/lib/llm-core instead.
 */
export class LegacyPromptRunner {
    /**
     * Ejecuta un prompt y devuelve el texto plano.
     */
    static async runTextPrompt(params: {
        key: string;
        variables: Record<string, any>;
        tenantId: string;
        correlationId?: string;
        modelOverride?: string;
    }): Promise<string> {
        const cid = params.correlationId || CorrelationIdService.generate();

        // 1. Resolver template (DB -> Fallback)
        let template = '';
        let model = params.modelOverride || AIMODELIDS.RAG_GENERATOR;

        try {
            // Intentamos obtener de la DB via PromptService
            const dbPrompt = await PromptService.getRenderedPrompt(params.key, params.variables, params.tenantId);
            template = (dbPrompt as any).text as string || '';

            // Si no hay template, forzamos fallback
            if (!template) throw new Error('Empty template in DB');
        } catch (error) {
            console.warn(`[PromptRunner] Error resolving prompt ${params.key} from DB, using fallbacks.`);
            const fallback = DEFAULT_PROMPTS.find(p => p.key === params.key);
            if (!fallback) throw new Error(`Prompt key '${params.key}' not found in DB or fallbacks`);

            template = this.renderTemplate(fallback.template as string, params.variables);
            if (!params.modelOverride) model = fallback.model;
        }

        await logEvento({
            level: 'DEBUG',
            source: 'PROMPT_RUNNER',
            action: 'RUN_PROMPT',
            message: `Running prompt ${params.key}`,
            correlationId: cid,
            tenantId: params.tenantId,
            details: { model, key: params.key }
        });

        return template; // En implementación real, devuelve result.text
    }

    /**
     * Ejecuta un prompt y parsea el resultado como JSON.
     */
    static async runJsonPrompt<T>(params: {
        key: string;
        variables: Record<string, any>;
        tenantId: string;
        correlationId?: string;
    }): Promise<T> {
        const text = await this.runTextPrompt(params);
        return LlmJsonUtils.safeParseLLMJson<T>(text, params.correlationId) as T;
    }

    /**
     * Helper simple para renderizado de variables {{var}}
     */
    private static renderTemplate(template: string, variables: Record<string, any>): string {
        let rendered = template;
        for (const [key, value] of Object.entries(variables)) {
            rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }
        return rendered;
    }
}
