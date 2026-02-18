import { StateGraph, END } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";
import { RagResult, hybridSearch } from "./rag-service";
import { callGeminiMini, callGeminiStream } from "./llm";
import { PromptService } from "./prompt-service";
import { PROMPTS } from './prompts';
import { logEvento } from "./logger";
import { RagEvaluationService } from "@/services/rag-evaluation-service";
import { FactCheckerService } from "./rag/fact-checker-service";

/**
 * Estado del Grafo RAG Agéntico (Visión 2.0 - Fase 26)
 */
const GraphState = Annotation.Root({
    question: Annotation<string>(),
    history: Annotation<any[]>(), // Support for thread history
    documents: Annotation<RagResult[]>(),
    generation: Annotation<string>(),
    retry_count: Annotation<number>(),
    tenantId: Annotation<string>(),
    correlationId: Annotation<string>(),
    industry: Annotation<string>(),
    environment: Annotation<string>(),
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
        const { question, tenantId, correlationId, environment, industry } = state;

        try {
            await logEvento({
                level: 'DEBUG',
                source: 'AGENT_RAG',
                action: 'RETRIEVE',
                message: `Retrieving docs for: ${question}`,
                correlationId
            });

            const docs = await hybridSearch(
                question,
                tenantId,
                correlationId,
                3,
                environment,
                industry
            );

            return {
                documents: docs,
                trace: [`RETRIEVAL: Found ${docs.length} chunks in ${industry}/${environment}.`]
            };
        } catch (error: any) {
            console.error("[AgenticRAGService] Error in retrieve node:", error);
            return {
                documents: [],
                trace: [`RETRIEVAL_ERROR: Failed to fetch documents. ${error.message}`]
            };
        }
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
        const { question, documents, tenantId, correlationId, history, industry } = state;
        const context = documents.length > 0
            ? documents.map(d => d.text).join("\n\n---\n\n")
            : "No relevant documents found in the corpus.";

        const promptKey = history && history.length > 0 ? 'CHAT_RAG_GENERATOR' : 'RAG_GENERATOR';

        let genPrompt: string;
        let model: string = 'gemini-1.5-flash';

        try {
            const result = await PromptService.getRenderedPrompt(
                promptKey,
                {
                    question,
                    context: context,
                    industry: industry || 'ELEVATORS',
                    history: history ? JSON.stringify(history) : "[]"
                },
                tenantId
            );
            genPrompt = result.text;
            model = result.model;
        } catch (err) {
            console.warn(`[AgenticRAGService] ⚠️ Fallback to Master Prompt (${promptKey}):`, err);
            const masterTemplate = (PROMPTS as any)[promptKey];
            genPrompt = masterTemplate
                .replace('{{question}}', question)
                .replace('{{context}}', context)
                .replace('{{history}}', history ? JSON.stringify(history) : "[]");
        }

        const generation = await callGeminiMini(genPrompt, tenantId, { correlationId, model });
        return {
            generation,
            trace: [`GENERATION: Response drafted by technical model using ${promptKey}${genPrompt === (PROMPTS as any)[promptKey] ? ' (FALLBACK)' : ''}.`]
        };
    }

    /**
     * Nodo: Transformación de Consulta (Re-write para mejorar recall)
     */
    private static async transformQuery(state: typeof GraphState.State) {
        const { question, tenantId, correlationId, retry_count } = state;

        try {
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
        } catch (error: any) {
            console.warn("[AgenticRAGService] Error in transformQuery node, using original question:", error);
            return {
                question,
                retry_count: (retry_count || 0) + 1,
                trace: ["RE-WRITE_ERROR: Optimization failed, using original question."]
            };
        }
    }

    /**
     * Nodo: Grader de Alucinaciones Avanzado (Phase 170)
     */
    private static async gradeGenerationNode(state: typeof GraphState.State) {
        const { documents, generation, tenantId, correlationId } = state;
        if (documents.length === 0) return { is_grounded: true };

        try {
            const report = await FactCheckerService.verify(
                generation,
                documents,
                tenantId,
                correlationId
            );

            return {
                is_grounded: report.isReliable,
                trace: [
                    report.isReliable
                        ? `VERIFICATION: Response verified with score ${report.hallucinationScore.toFixed(2)}. Claims verified: ${report.details.length}.`
                        : `VERIFICATION: Hallucination detected (Score: ${report.hallucinationScore.toFixed(2)}). Details: ${report.details.filter((d: any) => !d.verified).map((d: any) => d.claim).join("; ")}`
                ]
            };
        } catch (e) {
            console.error("[AgenticRAGService] Error in deep verification node:", e);
            return { is_grounded: true, trace: ["VERIFICATION: Error in deep fact checker. Assuming grounded (fallback)."] };
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
     * Compila e invoca el flujo agéntico devolviendo un flujo de eventos (docs, trace, generation stream)
     */
    public static async *runStream(
        question: string,
        tenantId: string,
        correlationId: string,
        history: any[] = [],
        industry: string = 'ELEVATORS',
        environment: string = 'PRODUCTION'
    ) {
        const workflow = this.createWorkflow();
        const app = workflow.compile();

        // 1. Flush headers immediately to prevent browser timeouts (Phase 96 Stability)
        yield { type: 'connected', data: { correlationId } };

        const resultState = await app.invoke({
            question,
            history,
            tenantId,
            correlationId,
            industry,
            environment,
            retry_count: 0,
            documents: [],
            generation: "",
            is_grounded: false,
            is_useful: false,
            trace: []
        });

        // 2. Emitir documentos y traza primero
        yield { type: 'docs', data: resultState.documents };
        yield { type: 'trace', data: resultState.trace };

        // 3. Circuit Breaker: Si no hay documentos, no llamar al LLM (ahorrar tokens y evitar alucinaciones/crash)
        if (resultState.documents.length === 0) {
            const noDocsMessage = "No he encontrado información relevante en la base de conocimiento para responder a tu pregunta.\n\nPor favor, asegúrate de que has subido los manuales técnicos correspondientes a la plataforma.";

            // Simular streaming de la respuesta estática para mantener UX consistente
            const tokens = noDocsMessage.split(/(?=[ ])/g); // Split conservando espacios
            for (const token of tokens) {
                yield { type: 'token', data: token };
                await new Promise(r => setTimeout(r, 10)); // Pequeño delay para naturalidad
            }
            return;
        }

        // 4. Obtener el prompt de generación para hacer el streaming real de la respuesta
        const context = resultState.documents.map((d: any) => d.text).join("\n\n---\n\n");

        const promptKey = history.length > 0 ? 'CHAT_RAG_GENERATOR' : 'RAG_GENERATOR';

        let genPrompt: string;
        let model: string = 'gemini-1.5-flash';

        try {
            const rendered = await PromptService.getRenderedPrompt(
                promptKey,
                {
                    question,
                    context,
                    industry: resultState.industry || 'ELEVATORS',
                    history: JSON.stringify(history)
                },
                tenantId
            );
            genPrompt = rendered.text;
            model = rendered.model;
        } catch (err) {
            console.warn(`[AgenticRAGService.runStream] ⚠️ Fallback to Master Prompt (${promptKey}):`, err);
            const masterTemplate = (PROMPTS as any)[promptKey];
            genPrompt = masterTemplate
                .replace('{{question}}', question)
                .replace('{{context}}', context)
                .replace('{{history}}', JSON.stringify(history));
        }

        const stream = await callGeminiStream(genPrompt, tenantId, { correlationId, model });

        // 4. Emitir tokens conforme llegan
        for await (const chunk of stream) {
            const text = chunk.text();
            if (text) {
                yield { type: 'token', data: text };
            }
        }
    }

    /**
     * Ejecuta el flujo agéntico completo (Blocking)
     */
    public static async run(
        question: string,
        tenantId: string,
        correlationId: string,
        history: any[] = [],
        industry: string = 'ELEVATORS',
        environment: string = 'PRODUCTION'
    ) {
        const workflow = this.createWorkflow();
        const app = workflow.compile();

        const result = await app.invoke({
            question, history, tenantId, correlationId, retry_count: 0,
            industry, environment,
            documents: [], generation: "", is_grounded: false, is_useful: false, trace: []
        });

        // Iniciar evaluación asíncrona (no bloquea la respuesta al usuario)
        RagEvaluationService.evaluateQuery(
            correlationId,
            question,
            result.generation,
            result.documents.map((d: any) => d.text || d.content),
            tenantId,
            result.trace || []
        ).catch(err => console.error("❌ [RAG EVAL ERROR]", err));

        return result;
    }

    private static createWorkflow() {
        return new StateGraph(GraphState)
            .addNode("retrieve", this.retrieve.bind(this))
            .addNode("grade_documents", this.gradeDocuments.bind(this))
            .addNode("generate", this.generate.bind(this))
            .addNode("transform_query", this.transformQuery.bind(this))
            .addNode("grade_generation", this.gradeGenerationNode.bind(this))
            .addNode("grade_answer", this.gradeAnswerNode.bind(this))
            .addEdge("__start__", "retrieve")
            .addEdge("retrieve", "grade_documents")
            .addConditionalEdges("grade_documents", (state) => {
                if (state.documents.length === 0 && (state.retry_count || 0) < 2) return "transform_query";
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
    }
}
