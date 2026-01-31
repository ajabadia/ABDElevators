import { StateGraph, END } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";
import { RagResult, performTechnicalSearch, hybridSearch } from "./rag-service";
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
    correlationId: Annotation<string>(),
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
        const { question, tenantId, correlationId } = state;

        await logEvento({
            level: 'DEBUG',
            source: 'AGENT_RAG',
            action: 'RETRIEVE',
            message: `Retrieving docs for: ${question}`,
            correlationId
        });

        const docs = await hybridSearch(question, tenantId, correlationId, 3);

        return {
            documents: docs,
            trace: [`RETRIEVAL: Found ${docs.length} chunks.`]
        };
    }

    /**
     * Nodo: Calificación de Documentos (Garantiza relevancia)
     */
    private static async gradeDocuments(state: typeof GraphState.State) {
        const { question, documents, tenantId, correlationId } = state;
        const relevantDocs: RagResult[] = [];

        for (const doc of documents) {
            const { text: gradePrompt, model } = await PromptService.getRenderedPrompt(
                'RAG_RELEVANCE_GRADER',
                { question, document: doc.text },
                tenantId
            );

            try {
                const response = await callGeminiMini(gradePrompt, tenantId, { correlationId, model });
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
            trace: [`GRADING_DOCS: ${relevantDocs.length}/${documents.length} documents are technical and relevant.`]
        };
    }

    /**
     * Nodo: Generación de Respuesta
     */
    private static async generate(state: typeof GraphState.State) {
        const { question, documents, tenantId, correlationId } = state;
        const context = documents.length > 0
            ? documents.map(d => d.text).join("\n\n---\n\n")
            : "No relevant documents found in the corpus.";

        const { text: genPrompt, model } = await PromptService.getRenderedPrompt(
            'RAG_GENERATOR',
            { question, context: context, industry: 'ELEVATORS' },
            tenantId
        );

        const generation = await callGeminiMini(genPrompt, tenantId, { correlationId, model });
        return {
            generation,
            trace: ["GENERATION: Response drafted by technical model."]
        };
    }

    /**
     * Nodo: Transformación de Consulta (Re-write para mejorar recall)
     */
    private static async transformQuery(state: typeof GraphState.State) {
        const { question, tenantId, correlationId, retry_count } = state;

        const { text: rewritePrompt, model } = await PromptService.getRenderedPrompt(
            'RAG_QUERY_REWRITER',
            { question },
            tenantId
        );

        const betterQuestion = await callGeminiMini(rewritePrompt, tenantId, { correlationId, model });

        return {
            question: betterQuestion,
            retry_count: (retry_count || 0) + 1,
            trace: [`RE-WRITE: Query optimized for better recall: "${betterQuestion}"`]
        };
    }

    /**
     * Nodo: Grader de Alucinaciones
     */
    private static async gradeGenerationNode(state: typeof GraphState.State) {
        const { documents, generation, tenantId, correlationId } = state;
        if (documents.length === 0) return { is_grounded: true };

        const context = documents.map(d => d.text).join("\n\n---\n\n");
        const { text: gradePrompt, model } = await PromptService.getRenderedPrompt(
            'RAG_HALLUCINATION_GRADER',
            { documents: context, generation },
            tenantId
        );

        try {
            const response = await callGeminiMini(gradePrompt, tenantId, { correlationId, model });
            const grade = JSON.parse(response);
            const isGrounded = grade.score === 'yes';
            return {
                is_grounded: isGrounded,
                trace: [isGrounded ? "VERIFICATION: Response verified against documents (No hallucinations)." : "VERIFICATION: Hallucination detected. Proceeding to regenerate."]
            };
        } catch (e) {
            return { is_grounded: true, trace: ["VERIFICATION: Error in hallucination grader. Assuming grounded (fallback)."] };
        }
    }

    /**
     * Nodo: Grader de Utilidad
     */
    private static async gradeAnswerNode(state: typeof GraphState.State) {
        const { question, generation, tenantId, correlationId } = state;

        const { text: gradePrompt, model } = await PromptService.getRenderedPrompt(
            'RAG_ANSWER_GRADER',
            { question, generation },
            tenantId
        );

        try {
            const response = await callGeminiMini(gradePrompt, tenantId, { correlationId, model });
            const grade = JSON.parse(response);
            const isUseful = grade.score === 'yes';
            return {
                is_useful: isUseful,
                trace: [isUseful ? "UTILITY: Response rated as useful." : "UTILITY: Insufficient response. Trying query refinement."]
            };
        } catch (e) {
            return { is_useful: true, trace: ["UTILITY: Error in utility grader. Assuming okay."] };
        }
    }

    /**
     * Ejecuta el flujo agéntico completo
     */
    public static async run(question: string, tenantId: string, correlationId: string) {
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
            correlationId,
            retry_count: 0,
            documents: [],
            generation: "",
            is_grounded: false,
            is_useful: false,
            trace: []
        });

        // Evaluation Automática (Phase 26.2)
        // La ejecutamos en background para no penalizar el SLA del usuario final
        EvaluationService.evaluateSession(
            tenantId,
            correlationId,
            question,
            result.generation,
            result.documents.map((d: any) => d.text),
            result.trace
        ).catch(err => console.error("Error in background evaluation:", err));

        return result;
    }
}
