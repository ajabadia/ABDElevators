import { getTenantCollection } from '@/lib/db-tenant';
import { RagEvaluationSchema } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';
import { RagJudgeService } from './rag-judge-service';
import { PromptRunner } from '@/lib/llm-core';
import { RagJudgeOutputSchema } from '@/lib/llm-core/schemas';

export class RagEvaluationService {
    /**
     * Evaluates a RAG completion using the LLM Judge via PromptRunner.
     */
    static async evaluateQuery(
        correlationId: string,
        query: string,
        response: string,
        contexts: string[],
        tenantId: string,
        trace: string[] = []
    ): Promise<any> {
        try {
            const contextText = contexts.join('\n\n');

            // 1. Run Judge Prompt via Pipeline
            const metrics = await PromptRunner.runJson<any>({
                key: 'RAG_JUDGE',
                variables: { query, context: contextText, response, vertical: 'ELEVATORS' },
                schema: RagJudgeOutputSchema,
                tenantId,
                correlationId
            });

            const evaluation = {
                tenantId,
                correlationId,
                query,
                generation: response,
                context_chunks: contexts,
                trace,
                metrics: {
                    faithfulness: metrics.faithfulness,
                    answer_relevance: metrics.answer_relevance,
                    context_precision: metrics.context_precision
                },
                judge_model: 'AUTO', // PromptRunner handles this
                feedback: metrics.reasoning,
                causal_analysis: metrics.causal_analysis,
                timestamp: new Date()
            };

            // 2. Persist & Audit
            const session = { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any;
            const collection = await getTenantCollection('rag_evaluations', session);

            const validated = RagEvaluationSchema.parse(evaluation);
            await collection.insertOne(validated);

            await logEvento({
                level: 'INFO',
                source: 'RAG_EVAL',
                action: 'EVALUATION_COMPLETE',
                message: `Evaluation complete for ${correlationId}`,
                correlationId,
                tenantId,
                details: metrics
            });

            // 3. Causal AI Self-Correction (Phase 86)
            const MIN_SCORE = 0.8;
            const needsCorrection = metrics.faithfulness < MIN_SCORE || metrics.answer_relevance < MIN_SCORE;

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
                    const validatedCorrected = RagEvaluationSchema.parse({
                        ...evaluation,
                        generation: correction.improvedResponse,
                        metrics: correction.newEvaluation.metrics,
                        feedback: correction.newEvaluation.feedback,
                        self_corrected: true,
                        original_evaluation: metrics,
                        timestamp: new Date()
                    });
                    await collection.insertOne(validatedCorrected);
                    return validatedCorrected;
                }
            }

            return validated;

        } catch (error) {
            console.error("[RAG EVALUATION ERROR]", error);
            throw error;
        }
    }

    static async listEvaluations(tenantId: string, limit: number = 50) {
        const session = { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any;
        const collection = await getTenantCollection('rag_evaluations', session);
        return await collection.find({}, { sort: { timestamp: -1 }, limit } as any);
    }

    static async getMetrics(tenantId: string) {
        const session = { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any;
        const collection = await getTenantCollection('rag_evaluations', session);
        const evals = await collection.find({}, { sort: { timestamp: -1 }, limit: 100 } as any);

        if (evals.length === 0) return { summary: { faithfulness: 0, relevance: 0, precision: 0, count: 0 }, trends: [] };

        const avg = (arr: any[], key: string) => arr.reduce((acc, curr) => acc + (curr.metrics[key] || 0), 0) / arr.length;

        return {
            summary: {
                faithfulness: avg(evals, 'faithfulness'),
                relevance: avg(evals, 'answer_relevance'),
                precision: avg(evals, 'context_precision'),
                count: evals.length
            },
            trends: evals.slice(0, 10).reverse().map((e: any) => ({
                date: e.timestamp,
                f: e.metrics.faithfulness,
                r: e.metrics.answer_relevance
            }))
        };
    }
}
