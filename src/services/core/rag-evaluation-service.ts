import { ragEvaluationRepository } from '@/lib/repositories/RagEvaluationRepository';
import { getSystemSession } from '@/lib/sessions/system-session';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { RagEvaluationSchema } from '@/lib/schemas';
import { TenantIdSchema, EntityIdSchema } from '@abd/platform-core';
import { RagJudgeService } from './rag-judge-service';
import { PromptRunner } from '@/lib/llm-core/PromptRunner';
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
        trace: string[] = [],
        goldenSetId?: string,
        metadata: { flowType?: string, agentKey?: string, engineVersion?: string } = {}
    ): Promise<Record<string, unknown>> {
        const tId = TenantIdSchema.parse(tenantId);
        const gId = goldenSetId ? EntityIdSchema.parse(goldenSetId) : EntityIdSchema.parse('000000000000000000000000');

        return await withCorrelation(
            { level: 'INFO', source: 'RAG_EVAL', action: 'EVALUATION', correlationId, tenantId: tId },
            async ({ log }) => {
                const contextText = contexts.join('\n\n');

                // 1. Run Judge Prompt via Pipeline
                const metrics = await PromptRunner.runJson<Record<string, unknown>>({
                    key: 'RAG_JUDGE',
                    variables: { query, context: contextText, response, vertical: 'ELEVATORS' },
                    schema: RagJudgeOutputSchema,
                    tenantId: tId,
                    correlationId
                });

                const evaluation = {
                    tenantId: tId,
                    correlationId,
                    query,
                    generation: response,
                    context_chunks: contexts,
                    trace,
                    flowType: metadata.flowType,
                    agentKey: metadata.agentKey,
                    engineVersion: metadata.engineVersion || 'v1',
                    goldenSetId: gId,
                    metrics: {
                        faithfulness: metrics.faithfulness as number,
                        answer_relevance: metrics.answer_relevance as number,
                        context_precision: metrics.context_precision as number
                    },
                    judge_model: 'AUTO',
                    feedback: metrics.reasoning as string,
                    causal_analysis: metrics.causal_analysis,
                    timestamp: new Date()
                };

                // 2. Persist & Audit
                const session = getSystemSession(tId);
                const validated = RagEvaluationSchema.parse(evaluation);
                await ragEvaluationRepository.create(validated, session);

                await log({
                    level: 'INFO',
                    action: 'EVALUATION_COMPLETE',
                    message: `Evaluation complete for ${correlationId}`,
                    details: metrics
                });

                // 3. Causal AI Self-Correction (Phase 86)
                const MIN_SCORE = 0.8;
                const needsCorrection = (metrics.faithfulness as number) < MIN_SCORE || (metrics.answer_relevance as number) < MIN_SCORE;

                if (needsCorrection && (metrics.causal_analysis as Record<string, unknown>)?.fix_strategy) {
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
                        await ragEvaluationRepository.create(validatedCorrected, session);
                        return validatedCorrected;
                    }
                }

                return validated;
            }
        );
    }

    static async listEvaluations(tenantId: string, limit: number = 50) {
        const tId = TenantIdSchema.parse(tenantId);
        const session = getSystemSession(tId);
        return await ragEvaluationRepository.list({}, { sort: { timestamp: -1 }, limit }, session);
    }

    static async getMetrics(tenantId: string) {
        const tId = TenantIdSchema.parse(tenantId);
        const session = getSystemSession(tId);

        const evals = await ragEvaluationRepository.list({}, { sort: { timestamp: -1 }, limit: 100 }, session);

        if (!Array.isArray(evals) || evals.length === 0) return { summary: { faithfulness: 0, relevance: 0, precision: 0, count: 0 }, trends: [] };

        const avg = (arr: any[], key: string) => arr.reduce((acc, curr) => acc + (((curr.metrics as Record<string, number>)?.[key]) || 0), 0) / arr.length;

        return {
            summary: {
                faithfulness: avg(evals, 'faithfulness'),
                relevance: avg(evals, 'answer_relevance'),
                precision: avg(evals, 'context_precision'),
                count: evals.length
            },
            trends: evals.slice(0, 10).reverse().map((e: any) => ({
                date: e.timestamp,
                f: (e.metrics as any)?.faithfulness,
                r: (e.metrics as any)?.answer_relevance
            }))
        };
    }
}
