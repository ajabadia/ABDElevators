
import { connectDB } from '@/lib/db';
import { PromptService } from '@/lib/prompt-service';
import { callGeminiMini } from '@/lib/llm';
import { RagEvaluationSchema } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';
import { ObjectId } from 'mongodb';

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
            const contextText = contexts.join('\n\n---\n\n');

            // 1. Get Judge Prompt
            const { text: prompt, model } = await PromptService.getRenderedPrompt(
                'RAG_JUDGE',
                { query, context: contextText, response },
                tenantId
            );

            // 2. Call LLM Judge (Pro version for high fidelity)
            const judgeResponse = await callGeminiMini(prompt, tenantId, {
                correlationId,
                model: 'gemini-1.5-pro' // Force Pro for better metrics
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
                judge_model: 'gemini-1.5-pro',
                feedback: metrics.reasoning,
                timestamp: new Date()
            };

            // 4. Persist in DB
            const db = await connectDB();
            const validated = RagEvaluationSchema.parse(evaluation);
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

            return validated;

        } catch (error) {
            console.error("[RAG EVALUATION ERROR]", error);
            await logEvento({
                level: 'ERROR',
                source: 'RAG_EVAL',
                action: 'EVALUATION_FAILED',
                message: `Failed to evaluate query ${correlationId}`,
                correlationId,
                tenantId,
                details: { error: String(error) }
            });
            return null;
        }
    }

    /**
     * Aggregates metrics for the dashboard
     */
    static async getMetrics(tenantId: string) {
        const db = await connectDB();
        const collection = db.collection('rag_evaluations');

        const pipeline = [
            { $match: { tenantId } },
            { $sort: { timestamp: -1 } },
            { $limit: 100 }, // Analyze last 100 queries
            {
                $group: {
                    _id: null,
                    avgFaithfulness: { $avg: "$metrics.faithfulness" },
                    avgRelevance: { $avg: "$metrics.answer_relevance" },
                    avgPrecision: { $avg: "$metrics.context_precision" },
                    totalEvaluated: { $sum: 1 }
                }
            }
        ];

        const results = await collection.aggregate(pipeline).toArray();
        const summary = results[0] || { avgFaithfulness: 0, avgRelevance: 0, avgPrecision: 0, totalEvaluated: 0 };

        // Get daily trends
        const dailyPipeline = [
            { $match: { tenantId } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    faithfulness: { $avg: "$metrics.faithfulness" },
                    relevance: { $avg: "$metrics.answer_relevance" }
                }
            },
            { $sort: { "_id": 1 } },
            { $limit: 30 }
        ];

        const trends = await collection.aggregate(dailyPipeline).toArray();

        return { summary, trends };
    }

    /**
     * List recent evaluations
     */
    static async listEvaluations(tenantId: string, limit = 20) {
        const db = await connectDB();
        const evaluations = await db.collection('rag_evaluations')
            .find({ tenantId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();

        return evaluations;
    }
}
