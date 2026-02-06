import { connectDB } from '@/lib/db';
import { PromptService } from '@/lib/prompt-service';
import { callGeminiMini } from '@/lib/llm';
import { RagEvaluationSchema } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';
import { RagJudgeService } from './rag-judge-service';

export class RagEvaluationService {
    /**
     * Evaluates a RAG completion using the LLM Judge
     */
    static async evaluateQuery(
        correlationId: string,
        query: string,
        response: string,
        contexts: string[],
        tenantId: string
    ): Promise<any> {
        try {
            // 1. Get Prompt
            const contextText = contexts.join('\n\n');
            const { text: prompt, model } = await PromptService.getRenderedPrompt(
                'RAG_JUDGE',
                { query, context: contextText, response, vertical: 'ELEVATORS' },
                tenantId
            );

            // 2. Call LLM Judge
            const judgeResponse = await callGeminiMini(prompt, tenantId, {
                correlationId,
                model
            });

            // 3. Parse Metrics
            const cleanJson = judgeResponse.replace(/```json|```/g, '').trim();
            const metrics = JSON.parse(cleanJson);

            const evaluation = {
                tenantId,
                correlationId,
                query,
                generation: response,
                context_chunks: contexts,
                metrics: {
                    faithfulness: metrics.faithfulness,
                    answer_relevance: metrics.answer_relevance,
                    context_precision: metrics.context_precision
                },
                judge_model: model,
                feedback: metrics.reasoning,
                causal_analysis: metrics.causal_analysis,
                timestamp: new Date()
            };

            // 4. Persist in DB
            let validated: any;
            try {
                const db = await connectDB();
                validated = RagEvaluationSchema.parse(evaluation);
                await db.collection('rag_evaluations').insertOne(validated);

                await logEvento({
                    level: 'INFO',
                    source: 'RAG_EVAL',
                    action: 'EVALUATION_COMPLETE',
                    message: `Evaluation complete for ${correlationId}. F:${metrics.faithfulness} R:${metrics.answer_relevance}`,
                    correlationId,
                    tenantId,
                    details: metrics
                });
            } catch (zodError: any) {
                console.error("❌ [ZOD ERROR]", zodError.errors || zodError);
                throw zodError;
            }

            // 5. Causal AI Self-Correction (Phase 86)
            const MIN_SCORE = 0.8;
            const needsCorrection = metrics.faithfulness < MIN_SCORE || metrics.answer_relevance < MIN_SCORE;

            let finalOutput = validated;

            if (needsCorrection && metrics.causal_analysis?.fix_strategy) {
                const correction = await RagJudgeService.selfCorrect(
                    query,
                    contextText,
                    response,
                    metrics,
                    tenantId,
                    correlationId
                );

                if (correction) {
                    const correctedEvaluation = {
                        tenantId,
                        correlationId,
                        query,
                        generation: correction.improvedResponse,
                        context_chunks: contexts,
                        metrics: {
                            faithfulness: correction.newEvaluation.metrics.faithfulness,
                            answer_relevance: correction.newEvaluation.metrics.answer_relevance,
                            context_precision: correction.newEvaluation.metrics.context_precision,
                        },
                        judge_model: correction.newEvaluation.judge_model,
                        feedback: correction.newEvaluation.feedback,
                        causal_analysis: correction.newEvaluation.causal_analysis,
                        self_corrected: true,
                        original_evaluation: metrics,
                        timestamp: new Date()
                    };

                    const db = await connectDB();
                    try {
                        const validatedCorrected = RagEvaluationSchema.parse(correctedEvaluation);
                        await db.collection('rag_evaluations').insertOne(validatedCorrected);
                        finalOutput = validatedCorrected;

                        await logEvento({
                            level: 'INFO',
                            source: 'RAG_EVAL',
                            action: 'SELF_CORRECTION_PERSISTED',
                            message: `Auto-corrección persistida para ${correlationId}`,
                            correlationId,
                            tenantId
                        });
                    } catch (corrError: any) {
                        console.error("[CORRECTION PERSIST ERROR]", corrError.errors || corrError);
                    }
                }
            }

            return finalOutput;

        } catch (error) {
            console.error("[RAG EVALUATION ERROR]", error);
            throw error;
        }
    }

    /**
     * Lists recent evaluations for a tenant
     */
    static async listEvaluations(tenantId: string, limit: number = 50): Promise<any[]> {
        const db = await connectDB();
        return await db.collection('rag_evaluations')
            .find({ tenantId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();
    }

    /**
     * Gets aggregate metrics for the RAG dashboard
     */
    static async getMetrics(tenantId: string): Promise<any> {
        const db = await connectDB();
        const evals = await db.collection('rag_evaluations')
            .find({ tenantId })
            .sort({ timestamp: -1 })
            .limit(100)
            .toArray();

        if (evals.length === 0) {
            return {
                summary: { faithfulness: 0, relevance: 0, precision: 0, count: 0 },
                trends: []
            };
        }

        const avg = (arr: any[], key: string) =>
            arr.reduce((acc, curr) => acc + (curr.metrics[key] || 0), 0) / arr.length;

        return {
            summary: {
                faithfulness: avg(evals, 'faithfulness'),
                relevance: avg(evals, 'answer_relevance'),
                precision: avg(evals, 'context_precision'),
                count: evals.length
            },
            trends: evals.slice(0, 10).reverse().map(e => ({
                date: e.timestamp,
                f: e.metrics.faithfulness,
                r: e.metrics.answer_relevance
            }))
        };
    }
}
