import { callGeminiPro } from '@/lib/llm';
import { PromptService } from '@/lib/prompt-service';
import { PROMPTS } from '@/lib/prompts';
import { logEvento } from '@/lib/logger';

export interface RagEvaluation {
    faithfulness: number;
    answer_relevance: number;
    context_precision: number;
    reasoning: string;
}

/**
 * ⚖️ Rag Judge Service (Phase 104)
 * Evaluates RAG response quality using a superior model.
 */
export class RagJudgeService {
    /**
     * Evaluates a RAG response.
     * @param query - The user's query
     * @param context - The retrieved chunks used for the answer
     * @param response - The generated RAG response to judge
     * @param industry - Target industry for domain-specific judgment
     */
    static async evaluateResponse(
        query: string,
        context: string,
        response: string,
        industry: string,
        tenantId: string,
        correlationId?: string
    ): Promise<RagEvaluation> {
        let renderedPrompt: string;
        let modelName = 'gemini-1.5-pro'; // Judge demands high reasoning

        try {
            const { text: promptText, model } = await PromptService.getRenderedPrompt(
                'RAG_JUDGE',
                {
                    query,
                    context,
                    response,
                    vertical: industry.toLowerCase()
                },
                tenantId
            );
            renderedPrompt = promptText;
            modelName = model || 'gemini-1.5-pro';
        } catch (error) {
            console.warn(`[RAG_JUDGE_SERVICE] ⚠️ Fallback to Master Prompt:`, error);
            await logEvento({
                level: 'WARN',
                source: 'RAG_JUDGE',
                action: 'PROMPT_FALLBACK',
                message: 'Usando prompt maestro por error en BD',
                correlationId: correlationId || 'rag-judge',
                tenantId
            });
            renderedPrompt = PROMPTS.RAG_JUDGE
                .replace('{{query}}', query)
                .replace('{{context}}', context)
                .replace('{{response}}', response)
                .replace('{{vertical}}', industry.toLowerCase());
        }

        try {
            const responseText = await callGeminiPro(renderedPrompt, tenantId, {
                correlationId: correlationId || 'rag-judge',
                model: modelName
            });

            const cleanText = responseText.replace(/```json|```/g, '').trim();
            const evaluation = JSON.parse(cleanText) as RagEvaluation;

            await logEvento({
                level: 'INFO',
                source: 'RAG_JUDGE',
                action: 'EVALUATE_SUCCESS',
                message: `Evaluación RAG completada para query: ${query.substring(0, 30)}...`,
                correlationId: correlationId || 'rag-judge',
                tenantId,
                details: { evaluation }
            });

            return evaluation;
        } catch (error: any) {
            console.error('[RAG JUDGE ERROR]', error);
            return {
                faithfulness: 0,
                answer_relevance: 0,
                context_precision: 0,
                reasoning: `Error en la evaluación: ${error.message}`
            };
        }
    }
}
