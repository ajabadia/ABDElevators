import { StateGraph, END } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";
import { RagResult, performTechnicalSearch } from "./rag-service";
import { callGeminiMini } from "./llm";
import { PromptService } from "./prompt-service";
import { logEvento } from "./logger";
import { EvaluationService } from "./evaluation-service";

/**
 * Estado del Grafo RAG Agéntico (Visión 2.0 - Fase 26)
 */
const GraphState = Annotation.Root({
    question: Annotation<string>(),
    documents: Annotation<RagResult[]>(),
    generation: Annotation<string>(),
    retry_count: Annotation<number>(),
    tenantId: Annotation<string>(),
    correlacion_id: Annotation<string>(),
    is_grounded: Annotation<boolean>(),
    is_useful: Annotation<boolean>(),
    trace: Annotation<string[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
});

/**
 * Agente RAG con Autocorrección (LangGraph)
 * Implementa el patrón Corrective RAG (CRAG) y Self-RAG.
 */
export class AgenticRAGService {

    /**
     * Nodo: Recuperación de Documentos
     */
    private static async retrieve(state: typeof GraphState.State) {
        const { question, tenantId, correlacion_id } = state;

        await logEvento({
            nivel: 'DEBUG',
            origen: 'AGENT_RAG',
            accion: 'RETRIEVE',
            mensaje: `Recuperando docs para: ${question}`,
            correlacion_id
        });

        const docs = await performTechnicalSearch(question, tenantId, correlacion_id, 3);

        return {
            documents: docs,
            trace: [`RECUPERACIÓN: Encontrados ${docs.length} fragmentos.`]
        };
    }

    /**
     * Nodo: Calificación de Documentos (Garantiza relevancia)
     */
    private static async gradeDocuments(state: typeof GraphState.State) {
        const { question, documents, tenantId, correlacion_id } = state;
        const relevantDocs: RagResult[] = [];

        for (const doc of documents) {
            const { text: gradePrompt, model } = await PromptService.getRenderedPrompt(
                'RAG_RELEVANCE_GRADER',
                { question, document: doc.texto },
                tenantId
            );

            try {
                const response = await callGeminiMini(gradePrompt, tenantId, { correlacion_id, model });
                const grade = JSON.parse(response);
                if (grade.score === 'yes') {
                    relevantDocs.push(doc);
                }
            } catch (e) {
                relevantDocs.push(doc); // Fallback
            }
        }

        return {
            documents: relevantDocs,
            trace: [`CALIFICACIÓN_DOCS: ${relevantDocs.length}/${documents.length} documentos son técnicos y relevantes.`]
        };
    }

    /**
     * Nodo: Generación de Respuesta
     */
    private static async generate(state: typeof GraphState.State) {
        const { question, documents, tenantId, correlacion_id } = state;
        const context = documents.length > 0
            ? documents.map(d => d.texto).join("\n\n---\n\n")
            : "No hay documentos relevantes encontrados en el corpus.";

        const { text: genPrompt, model } = await PromptService.getRenderedPrompt(
            'RAG_GENERATOR',
            { question, context: context, industry: 'ELEVATORS' },
            tenantId
        );

        const generation = await callGeminiMini(genPrompt, tenantId, { correlacion_id, model });
        return {
            generation,
            trace: ["GENERACIÓN: Respuesta redactada por el modelo técnico."]
        };
    }

    /**
     * Nodo: Transformación de Consulta (Re-write para mejorar recall)
     */
    private static async transformQuery(state: typeof GraphState.State) {
        const { question, tenantId, correlacion_id, retry_count } = state;

        const { text: rewritePrompt, model } = await PromptService.getRenderedPrompt(
            'RAG_QUERY_REWRITER',
            { question },
            tenantId
        );

        const betterQuestion = await callGeminiMini(rewritePrompt, tenantId, { correlacion_id, model });

        return {
            question: betterQuestion,
            retry_count: (retry_count || 0) + 1,
            trace: [`RE-ESCRITURA: Consulta optimizada para mejor búsqueda: "${betterQuestion}"`]
        };
    }

    /**
     * Nodo: Grader de Alucinaciones
     */
    private static async gradeGenerationNode(state: typeof GraphState.State) {
        const { documents, generation, tenantId, correlacion_id } = state;
        if (documents.length === 0) return { is_grounded: true };

        const context = documents.map(d => d.texto).join("\n\n---\n\n");
        const { text: gradePrompt, model } = await PromptService.getRenderedPrompt(
            'RAG_HALLUCINATION_GRADER',
            { documents: context, generation },
            tenantId
        );

        try {
            const response = await callGeminiMini(gradePrompt, tenantId, { correlacion_id, model });
            const grade = JSON.parse(response);
            const isGrounded = grade.score === 'yes';
            return {
                is_grounded: isGrounded,
                trace: [isGrounded ? "VERIFICACIÓN: Respuesta verificada contra documentos (Sin alucinaciones)." : "VERIFICACIÓN: Alucinación detectada. Procediendo a regenerar."]
            };
        } catch (e) {
            return { is_grounded: true, trace: ["VERIFICACIÓN: Error en juez de alucinaciones. Asumiendo grounded (fallback)."] };
        }
    }

    /**
     * Nodo: Grader de Utilidad
     */
    private static async gradeAnswerNode(state: typeof GraphState.State) {
        const { question, generation, tenantId, correlacion_id } = state;

        const { text: gradePrompt, model } = await PromptService.getRenderedPrompt(
            'RAG_ANSWER_GRADER',
            { question, generation },
            tenantId
        );

        try {
            const response = await callGeminiMini(gradePrompt, tenantId, { correlacion_id, model });
            const grade = JSON.parse(response);
            const isUseful = grade.score === 'yes';
            return {
                is_useful: isUseful,
                trace: [isUseful ? "UTILIDAD: Respuesta calificada como útil para el técnico." : "UTILIDAD: Respuesta insuficiente. Intentando refinamiento de búsqueda."]
            };
        } catch (e) {
            return { is_useful: true, trace: ["UTILIDAD: Error en juez de utilidad. Asumiendo okay."] };
        }
    }

    /**
     * Ejecuta el flujo agéntico completo
     */
    public static async run(question: string, tenantId: string, correlacion_id: string) {
        const workflow = new StateGraph(GraphState)
            .addNode("retrieve", this.retrieve.bind(this))
            .addNode("grade_documents", this.gradeDocuments.bind(this))
            .addNode("generate", this.generate.bind(this))
            .addNode("transform_query", this.transformQuery.bind(this))
            .addNode("grade_generation", this.gradeGenerationNode.bind(this))
            .addNode("grade_answer", this.gradeAnswerNode.bind(this))

            .addEdge("__start__", "retrieve")
            .addEdge("retrieve", "grade_documents")
            .addConditionalEdges("grade_documents", (state) => {
                if (state.documents.length === 0 && (state.retry_count || 0) < 2) {
                    return "transform_query";
                }
                return "generate";
            })
            .addEdge("transform_query", "retrieve")
            .addEdge("generate", "grade_generation")
            .addConditionalEdges("grade_generation", (state) => {
                return state.is_grounded ? "grade_answer" : "generate";
            })
            .addConditionalEdges("grade_answer", (state) => {
                return state.is_useful ? END : "transform_query";
            });

        const app = workflow.compile();

        const result = await app.invoke({
            question,
            tenantId,
            correlacion_id,
            retry_count: 0,
            documents: [],
            generation: "",
            is_grounded: false,
            is_useful: false,
            trace: []
        });

        // Evaluación Automática (Phase 26.2)
        // La ejecutamos en background para no penalizar el SLA del usuario final
        EvaluationService.evaluateSession(
            tenantId,
            correlacion_id,
            question,
            result.generation,
            result.documents.map((d: any) => d.texto),
            result.trace
        ).catch(err => console.error("Error in background evaluation:", err));

        return result;
    }
}
