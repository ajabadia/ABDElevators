import { connectDB } from "@/lib/db";
import { RagEvaluationSchema } from "@/lib/schemas/knowledge"; // Use the consolidated one if compatible or specific local
import { PromptService } from "@/services/llm/prompt-service";
import { ragEvaluationRepository } from "@/lib/repositories/RagEvaluationRepository";
import { PromptRunner } from "@/lib/llm-core/PromptRunner";
import { GraderScoreSchema } from "@/lib/llm-core/schemas";
import { AIMODELIDS } from "@/lib/ai-models";

/**
 * Servicio de Evaluación RAG (Fase 26.2)
 * Implementa métricas inspiradas en RAGAs para control de calidad.
 */
export class EvaluationService {

    /**
     * Evalúa una sesión RAG completa
     */
    static async evaluateSession(
        tenantId: string,
        correlationId: string,
        query: string,
        generation: string,
        documents: string[],
        goldenSetId?: string,
        trace: string[] = []
    ) {
        const tId = TenantIdSchema.parse(tenantId);
        const gId = goldenSetId ? EntityIdSchema.parse(goldenSetId) : EntityIdSchema.parse('000000000000000000000000');
        const start = Date.now();

        try {
            // 1. Faithfulness (Based on RAG_HALLUCINATION_GRADER)
            const faithfulness = await this.calculateFaithfulness(tId, generation, documents, correlationId);

            // 2. Answer Relevance (Based on RAG_ANSWER_GRADER)
            const answerRelevance = await this.calculateAnswerRelevance(tId, query, generation, correlationId);

            // 3. Context Precision (Based on RAG_RELEVANCE_GRADER averaged)
            const contextPrecision = await this.calculateContextPrecision(tId, query, documents, correlationId);

            const evaluation = {
                tenantId: tId,
                correlationId,
                query,
                generation,
                context_chunks: documents,
                trace,
                goldenSetId: gId,
                metrics: {
                    faithfulness,
                    answer_relevance: answerRelevance,
                    context_precision: contextPrecision
                },
                judge_model: AIMODELIDS.GEMINI_1_5_PRO,
                timestamp: new Date()
            };

            // Create evaluation record with governance metadata
            const evalRecord = await ragEvaluationRepository.create({
                ...evaluation,
                metadata: {
                    ...(evaluation as any).metadata,
                    promptKey: 'RAG_EVALUATION',
                    promptVersion: 1, // Fallback for fixed version or resolved from elsewhere
                    modelId: AIMODELIDS.GEMINI_1_5_FLASH,
                    correlationId: correlationId,
                    task: 'GENERIC_EVALUATION'
                }
            } as any, { user: { tenantId: tId } } as any);

            await logEvento({
                level: 'INFO',
                source: 'EVALUATION_SERVICE',
                action: 'EVALUATION_SUCCESS',
                message: `RAG Evaluation completed for ${correlationId}`,
                tenantId: tId,
                correlationId,
                details: { metrics: evaluation.metrics, durationMs: Date.now() - start }
            });

            return evaluation;

        } catch (error) {
            await logEvento({
                level: 'ERROR',
                source: 'EVALUATION_SERVICE',
                action: 'EVALUATION_ERROR',
                message: `Error evaluating RAG session: ${(error as Error).message}`,
                tenantId: tId,
                correlationId,
                stack: (error as Error).stack
            });
            throw error;
        }
    }

    private static async calculateFaithfulness(tenantId: string, generation: string, documents: string[], correlationId: string): Promise<number> {
        const context = documents.join("\n\n---\n\n");
        try {
            const result = await PromptRunner.runJson({
                key: 'RAG_HALLUCINATION_GRADER',
                variables: { documents: context, generation },
                schema: GraderScoreSchema,
                tenantId,
                correlationId
            });
            return result.score === 'yes' ? 1.0 : 0.0;
        } catch (error) {
            console.error("[EVALUATION_SERVICE] Error calculating faithfulness:", error);
            return 0.5; // Uncertainty
        }
    }

    private static async calculateAnswerRelevance(tenantId: string, query: string, generation: string, correlationId: string): Promise<number> {
        try {
            const result = await PromptRunner.runJson({
                key: 'RAG_ANSWER_GRADER',
                variables: { question: query, generation },
                schema: GraderScoreSchema,
                tenantId,
                correlationId
            });
            return result.score === 'yes' ? 1.0 : 0.0;
        } catch (error) {
            console.error("[EVALUATION_SERVICE] Error calculating answer relevance:", error);
            return 0.5;
        }
    }

    private static async calculateContextPrecision(tenantId: string, query: string, documents: string[], correlationId: string): Promise<number> {
        if (documents.length === 0) return 0;

        let hits = 0;
        for (const doc of documents) {
            try {
                const result = await PromptRunner.runJson({
                    key: 'RAG_RELEVANCE_GRADER',
                    variables: { question: query, document: doc },
                    schema: GraderScoreSchema,
                    tenantId,
                    correlationId
                });
                if (result.score === 'yes') hits++;
            } catch (error) {
                console.error("[EVALUATION_SERVICE] Error calculating context precision fragment:", error);
            }
        }

        return hits / documents.length;
    }
}
