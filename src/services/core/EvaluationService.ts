import { connectDB } from "@/lib/db";
import { RagEvaluationSchema } from "@/lib/schemas";
import { PromptService } from "@/services/llm/prompt-service";
import { callGeminiMini } from "@/services/llm/llm-service";
import { logEvento } from "@/lib/logger";
import { AI_MODEL_IDS as AIMODELIDS } from "@abd/platform-core";

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
        trace: string[] = []
    ) {
        const start = Date.now();

        try {
            // 1. Faithfulness (Based on RAG_HALLUCINATION_GRADER)
            const faithfulness = await this.calculateFaithfulness(tenantId, generation, documents, correlationId);

            // 2. Answer Relevance (Based on RAG_ANSWER_GRADER)
            const answerRelevance = await this.calculateAnswerRelevance(tenantId, query, generation, correlationId);

            // 3. Context Precision (Based on RAG_RELEVANCE_GRADER averaged)
            const contextPrecision = await this.calculateContextPrecision(tenantId, query, documents, correlationId);

            const evaluation = {
                tenantId,
                correlationId,
                query,
                generation,
                context_chunks: documents,
                trace,
                metrics: {
                    faithfulness,
                    answer_relevance: answerRelevance,
                    context_precision: contextPrecision
                },
                judge_model: AIMODELIDS.GEMINI_1_5_PRO,
                timestamp: new Date()
            };

            const validated = RagEvaluationSchema.parse(evaluation);

            const db = await connectDB();
            await db.collection('rag_evaluations').insertOne(validated);

            await logEvento({
                level: 'INFO',
                source: 'EVALUATION_SERVICE',
                action: 'EVALUATION_SUCCESS',
                message: `RAG Evaluation completed for ${correlationId}`,
                tenantId,
                correlationId,
                details: { metrics: validated.metrics, durationMs: Date.now() - start }
            });

            return validated;

        } catch (error) {
            await logEvento({
                level: 'ERROR',
                source: 'EVALUATION_SERVICE',
                action: 'EVALUATION_ERROR',
                message: `Error evaluating RAG session: ${(error as Error).message}`,
                tenantId,
                correlationId,
                stack: (error as Error).stack
            });
            throw error;
        }
    }

    private static async calculateFaithfulness(tenantId: string, generation: string, documents: string[], correlationId: string): Promise<number> {
        const context = documents.join("\n\n---\n\n");
        const { text: prompt, model } = await PromptService.getRenderedPrompt(
            'RAG_HALLUCINATION_GRADER',
            { documents: context, generation },
            tenantId
        );

        const response = await callGeminiMini(prompt, tenantId, { correlationId: correlationId, model });
        try {
            const grade = JSON.parse(response);
            return grade.score === 'yes' ? 1.0 : 0.0;
        } catch {
            return 0.5; // Uncertainty
        }
    }

    private static async calculateAnswerRelevance(tenantId: string, query: string, generation: string, correlationId: string): Promise<number> {
        const { text: prompt, model } = await PromptService.getRenderedPrompt(
            'RAG_ANSWER_GRADER',
            { question: query, generation },
            tenantId
        );

        const response = await callGeminiMini(prompt, tenantId, { correlationId: correlationId, model });
        try {
            const grade = JSON.parse(response);
            return grade.score === 'yes' ? 1.0 : 0.0;
        } catch {
            return 0.5;
        }
    }

    private static async calculateContextPrecision(tenantId: string, query: string, documents: string[], correlationId: string): Promise<number> {
        if (documents.length === 0) return 0;

        let hits = 0;
        for (const doc of documents) {
            const { text: prompt, model } = await PromptService.getRenderedPrompt(
                'RAG_RELEVANCE_GRADER',
                { question: query, document: doc },
                tenantId
            );

            try {
                const response = await callGeminiMini(prompt, tenantId, { correlationId: correlationId, model });
                const grade = JSON.parse(response);
                if (grade.score === 'yes') hits++;
            } catch {
                // Ignore failure
            }
        }

        return hits / documents.length;
    }
}
