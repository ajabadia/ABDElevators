import { callGeminiPro } from '@/lib/llm';
import { PromptService } from '@/lib/prompt-service';
import { logEvento } from '@/lib/logger';
import { AI_MODEL_IDS } from '@/lib/constants/ai-models';

// Interface matching the schema for internal service use
export interface RagEvaluationResult {
    tenantId: string;
    correlationId: string;
    query: string;
    generation: string;
    context_chunks: string[];
    metrics: {
        faithfulness: number;
        answer_relevance: number;
        context_precision: number;
    };
    judge_model: string;
    feedback?: string;
    causal_analysis?: {
        cause_id: string;
        fix_strategy: string;
    };
    self_corrected?: boolean;
    original_evaluation?: any;
    timestamp: Date;
}

export class RagJudgeService {
    /**
     * Evalúa una respuesta RAG usando el Auditor LLM (Fase 86)
     */
    static async evaluateResponse(
        query: string,
        context: string,
        response: string,
        industry: string,
        tenantId: string,
        correlationId?: string
    ): Promise<RagEvaluationResult> {
        let modelName: string = AI_MODEL_IDS.GEMINI_2_5_PRO;
        let renderedPrompt = '';

        try {
            const promptData = await PromptService.getRenderedPrompt(
                'RAG_JUDGE',
                { query, context, response, vertical: industry },
                tenantId
            );
            renderedPrompt = promptData.text;
            modelName = promptData.model || modelName;
        } catch (error: any) {
            console.error('❌ [RAG JUDGE] Error rendering prompt:', error.message);
            return {
                tenantId,
                correlationId: correlationId || 'rag-judge',
                query,
                generation: response,
                context_chunks: [context],
                metrics: { faithfulness: 0, answer_relevance: 0, context_precision: 0 },
                judge_model: 'fallback',
                feedback: 'Error rendering judge prompt',
                timestamp: new Date()
            };
        }

        try {
            const responseText = await callGeminiPro(renderedPrompt, tenantId, {
                correlationId: correlationId || 'rag-judge',
                model: modelName
            });

            const cleanText = responseText.replace(/```json|```/g, '').trim();
            const metrics = JSON.parse(cleanText);

            return {
                tenantId,
                correlationId: correlationId || 'rag-judge',
                query,
                generation: response,
                context_chunks: [context],
                metrics: {
                    faithfulness: metrics.faithfulness,
                    answer_relevance: metrics.answer_relevance,
                    context_precision: metrics.context_precision
                },
                judge_model: modelName,
                feedback: metrics.reasoning,
                causal_analysis: metrics.causal_analysis,
                timestamp: new Date()
            };
        } catch (error: any) {
            console.error('❌ [RAG JUDGE ERROR]', error);
            return {
                tenantId,
                correlationId: correlationId || 'rag-judge',
                query,
                generation: response,
                context_chunks: [context],
                metrics: { faithfulness: 0, answer_relevance: 0, context_precision: 0 },
                judge_model: modelName,
                feedback: `Error en la evaluación: ${error.message}`,
                timestamp: new Date()
            };
        }
    }

    /**
     * Attempts to self-correct a RAG response based on causal feedback.
     */
    static async selfCorrect(
        query: string,
        context: string,
        badResponse: string,
        evaluation: any, // Use any to avoid direct circular ref issues in typing if needed
        tenantId: string,
        correlationId?: string
    ): Promise<{ improvedResponse: string, newEvaluation: RagEvaluationResult } | null> {
        if (!evaluation.causal_analysis?.fix_strategy) return null;

        try {
            const { text: promptText } = await PromptService.getRenderedPrompt(
                'RAG_SELF_CORRECT',
                {
                    query,
                    context,
                    response: badResponse,
                    cause_id: evaluation.causal_analysis.cause_id,
                    fix_strategy: evaluation.causal_analysis.fix_strategy
                },
                tenantId
            );

            // Execute correction
            const improvedResponse = await callGeminiPro(promptText, tenantId, {
                correlationId: `${correlationId}-retry`,
                model: AI_MODEL_IDS.GEMINI_2_5_PRO
            });

            // Re-evaluate
            const newEvaluation = await this.evaluateResponse(
                query,
                context,
                improvedResponse,
                'GENERIC',
                tenantId,
                `${correlationId}-retry`
            );

            return { improvedResponse, newEvaluation };
        } catch (error: any) {
            console.error('[SELF-CORRECT ERROR]', error);
            return null;
        }
    }
}
