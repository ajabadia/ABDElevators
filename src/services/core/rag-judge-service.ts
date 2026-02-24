import { PromptRunner } from '@/lib/llm-core/PromptRunner';
import { RagJudgeOutputSchema } from '@/lib/llm-core/schemas';
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
     * Evalúa una respuesta RAG usando el Auditor LLM unificado (Era 7).
     */
    static async evaluateResponse(
        query: string,
        context: string,
        response: string,
        industry: string,
        tenantId: string,
        correlationId?: string
    ): Promise<RagEvaluationResult> {
        const cid = correlationId || `judge-${Date.now()}`;

        try {
            const evaluation = await PromptRunner.runJson({
                key: 'RAG_JUDGE',
                variables: { query, context, response, vertical: industry },
                schema: RagJudgeOutputSchema,
                tenantId,
                correlationId: cid,
                temperature: 0.1
            });

            return {
                tenantId,
                correlationId: cid,
                query,
                generation: response,
                context_chunks: [context],
                metrics: {
                    faithfulness: evaluation.faithfulness,
                    answer_relevance: evaluation.answer_relevance,
                    context_precision: evaluation.context_precision
                },
                judge_model: 'gemini-2.5-pro', // Default for judge
                feedback: evaluation.reasoning,
                causal_analysis: evaluation.causal_analysis,
                timestamp: new Date()
            };
        } catch (error: any) {
            console.error('❌ [RAG JUDGE ERROR]', error);
            return {
                tenantId,
                correlationId: cid,
                query,
                generation: response,
                context_chunks: [context],
                metrics: { faithfulness: 0, answer_relevance: 0, context_precision: 0 },
                judge_model: 'error',
                feedback: `Error en la evaluación: ${error.message}`,
                timestamp: new Date()
            };
        }
    }

    /**
     * Attempts to self-correct a RAG response based on causal feedback using LLM Core.
     */
    static async selfCorrect(
        query: string,
        context: string,
        badResponse: string,
        evaluation: any,
        tenantId: string,
        correlationId?: string
    ): Promise<{ improvedResponse: string, newEvaluation: RagEvaluationResult } | null> {
        if (!evaluation.causal_analysis?.fix_strategy) return null;
        const cid = correlationId || `correct-${Date.now()}`;

        try {
            const improvedResponse = await PromptRunner.runText({
                key: 'RAG_SELF_CORRECT',
                variables: {
                    query,
                    context,
                    response: badResponse,
                    cause_id: evaluation.causal_analysis.cause_id,
                    fix_strategy: evaluation.causal_analysis.fix_strategy
                },
                tenantId,
                correlationId: cid,
                temperature: 0.7
            });

            // Re-evaluate
            const newEvaluation = await this.evaluateResponse(
                query,
                context,
                improvedResponse,
                'GENERIC',
                tenantId,
                `${cid}-retry`
            );

            return { improvedResponse, newEvaluation };
        } catch (error: any) {
            console.error('[SELF-CORRECT ERROR]', error);
            return null;
        }
    }
}
