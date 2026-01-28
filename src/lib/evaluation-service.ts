import { connectDB } from "./db";
import { RagEvaluationSchema } from "./schemas";
import { PromptService } from "./prompt-service";
import { callGeminiMini } from "./llm";
import { logEvento } from "./logger";

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
        correlacion_id: string,
        query: string,
        generation: string,
        documents: string[],
        trace: string[] = []
    ) {
        const inicio = Date.now();

        try {
            // 1. Faithfulness (Basado en RAG_HALLUCINATION_GRADER)
            const faithfulness = await this.calculateFaithfulness(tenantId, generation, documents, correlacion_id);

            // 2. Answer Relevance (Basado en RAG_ANSWER_GRADER)
            const answerRelevance = await this.calculateAnswerRelevance(tenantId, query, generation, correlacion_id);

            // 3. Context Precision (Basado en RAG_RELEVANCE_GRADER promediado)
            const contextPrecision = await this.calculateContextPrecision(tenantId, query, documents, correlacion_id);

            const evaluation = {
                tenantId,
                correlacion_id,
                query,
                generation,
                context_chunks: documents,
                trace,
                metrics: {
                    faithfulness,
                    answer_relevance: answerRelevance,
                    context_precision: contextPrecision
                },
                judge_model: 'gemini-2.5-flash',
                timestamp: new Date()
            };

            const validated = RagEvaluationSchema.parse(evaluation);

            const db = await connectDB();
            await db.collection('rag_evaluations').insertOne(validated);

            await logEvento({
                nivel: 'INFO',
                origen: 'EVALUATION_SERVICE',
                accion: 'EVALUATION_SUCCESS',
                mensaje: `Evaluación RAG completada para ${correlacion_id}`,
                tenantId,
                correlacion_id,
                detalles: { metrics: validated.metrics, duracion_ms: Date.now() - inicio }
            });

            return validated;

        } catch (error) {
            await logEvento({
                nivel: 'ERROR',
                origen: 'EVALUATION_SERVICE',
                accion: 'EVALUATION_ERROR',
                mensaje: `Error evaluando sesión RAG: ${(error as Error).message}`,
                tenantId,
                correlacion_id,
                stack: (error as Error).stack
            });
            throw error;
        }
    }

    private static async calculateFaithfulness(tenantId: string, generation: string, documents: string[], correlacion_id: string): Promise<number> {
        const context = documents.join("\n\n---\n\n");
        const { text: prompt, model } = await PromptService.getRenderedPrompt(
            'RAG_HALLUCINATION_GRADER',
            { documents: context, generation },
            tenantId
        );

        const response = await callGeminiMini(prompt, tenantId, { correlacion_id, model });
        try {
            const grade = JSON.parse(response);
            return grade.score === 'yes' ? 1.0 : 0.0;
        } catch {
            return 0.5; // Incertidumbre
        }
    }

    private static async calculateAnswerRelevance(tenantId: string, query: string, generation: string, correlacion_id: string): Promise<number> {
        const { text: prompt, model } = await PromptService.getRenderedPrompt(
            'RAG_ANSWER_GRADER',
            { question: query, generation },
            tenantId
        );

        const response = await callGeminiMini(prompt, tenantId, { correlacion_id, model });
        try {
            const grade = JSON.parse(response);
            return grade.score === 'yes' ? 1.0 : 0.0;
        } catch {
            return 0.5;
        }
    }

    private static async calculateContextPrecision(tenantId: string, query: string, documents: string[], correlacion_id: string): Promise<number> {
        if (documents.length === 0) return 0;

        let hits = 0;
        for (const doc of documents) {
            const { text: prompt, model } = await PromptService.getRenderedPrompt(
                'RAG_RELEVANCE_GRADER',
                { question: query, document: doc },
                tenantId
            );

            try {
                const response = await callGeminiMini(prompt, tenantId, { correlacion_id, model });
                const grade = JSON.parse(response);
                if (grade.score === 'yes') hits++;
            } catch {
                // Ignore failure
            }
        }

        return hits / documents.length;
    }
}
