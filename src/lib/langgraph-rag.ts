import { StateGraph, END } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";
import { hybridSearch, performTechnicalSearch } from '@abd/rag-engine/server';
import { RagResult } from '@abd/rag-engine';
import { callGeminiMini, callGeminiStream } from "@/services/llm/llm-service";
import { PromptService } from "@/services/llm/prompt-service";
import { PROMPTS } from './prompts';
import { logEvento } from "./logger";
import { DEFAULT_MODEL } from "./constants/ai-models";
import { RagEvaluationService } from "@/services/core/rag-evaluation-service";
import { FactCheckerService } from "@/services/core/rag/fact-checker-service";

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
    environment: Annotation<string>(),
    intensity: Annotation<string>(), // FAST | DEEP | KW_ONLY
    industry: Annotation<string>(),
    is_grounded: Annotation<boolean>(),
    is_useful: Annotation<boolean>(),
    filename: Annotation<string | undefined>(),
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
        const { question, tenantId, correlationId, environment, industry, filename } = state;

        try {
            await logEvento({
                level: 'DEBUG',
                source: 'AGENT_RAG',
                action: 'RETRIEVE',
                message: `Retrieving docs for: ${question}`,
                correlationId
            });

            const { truncateContext } = await import('@abd/rag-engine/server');

            const docs = await hybridSearch(
                question,
                tenantId,
                correlationId,
                industry,
                {
                    limit: state.intensity === 'KW_ONLY' ? 10 : 4,
                    environment,
                    filename,
                    intensity: state.intensity as any
                }
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
     * Optimizado: Procesamiento en paralelo para evitar cuellos de botella (Phase 182)
     */
    private static async gradeDocuments(state: typeof GraphState.State) {
        const { question, documents, tenantId, correlationId } = state;

        if (!documents || documents.length === 0) {
            return { documents: [], trace: ["GRADING_DOCS: No documents to grade."] };
        }

        const gradingPromises = documents.map(async (doc) => {
            try {
                const { text: gradePrompt, model } = await PromptService.getRenderedPrompt(
                    'RAG_RELEVANCE_GRADER',
                    { question, document: doc.text },
                    tenantId,
                    'PRODUCTION',
                    'GENERIC',
                    { user: { tenantId, role: 'SYSTEM' } } as any // Session bridge
                );

                const response = await callGeminiMini(gradePrompt, tenantId, { correlationId, model });
                const grade = JSON.parse(response);
                return grade.score === 'yes' ? doc : null;
            } catch (e) {
                console.warn("[AgenticRAGService] Grading failed for a chunk, keeping as fallback.", e);
                return doc; // Fallback: Be permissive if grader fails
            }
        });

        const results = await Promise.all(gradingPromises);
        const relevantDocs = results.filter((doc): doc is RagResult => doc !== null);

        return {
            documents: relevantDocs,
            trace: [`GRADING_DOCS: ${relevantDocs.length}/${documents.length} documents verified as relevant.`]
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
        let model: string = DEFAULT_MODEL;

        try {
            const result = await PromptService.getRenderedPrompt(
                promptKey,
                {
                    question,
                    context: context,
                    industry: industry || 'ELEVATORS',
                    history: history ? JSON.stringify(history) : "[]"
                },
                tenantId,
                'PRODUCTION',
                industry || 'GENERIC',
                { user: { tenantId, role: 'SYSTEM' } } as any
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

        const { truncateContext } = await import('@abd/rag-engine/server');
        const truncated = truncateContext(genPrompt, history || [], documents);

        // Standardize context for callGeminiMini
        const contextString = truncated.chunks.map(d => d.text).join("\n\n---\n\n");
        const finalPrompt = genPrompt.replace('{{context}}', contextString);

        const generation = await callGeminiMini(finalPrompt, tenantId, {
            correlationId,
            model
        });
        return {
            generation,
            documents: truncated.chunks,
            trace: [`GENERATION: Response drafted (Budget: 3k tokens) using ${promptKey}.`]
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
                { query: question, question, history: state.history ? JSON.stringify(state.history) : "[]" },
                tenantId,
                'PRODUCTION',
                'GENERIC',
                { user: { tenantId, role: 'SYSTEM' } } as any
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
                trace: [`RE-WRITE_ERROR: Optimization failed (${error.message || 'Unknown error'}), using original question.`]
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
            tenantId,
            'PRODUCTION',
            'GENERIC',
            { user: { tenantId, role: 'SYSTEM' } } as any
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
        industry: string = 'GENERIC',
        environment: string = 'PRODUCTION',
        filename?: string
    ) {
        const workflow = this.createWorkflow();
        const app = workflow.compile();

        let lastState: any = null;

        try {
            // 1. Initial Handshake & Proactive Thinking
            yield { type: 'connected', data: { correlationId } };
            yield { type: 'trace', data: ["INICIO: Inicializando motor de razonamiento agéntico..."] };

            const initialState = {
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
                filename,
                intensity: (question.includes('--deep') ? 'DEEP' : (question.includes('--fast') ? 'FAST' : 'FAST')), // Default to FAST for quota safety
                trace: []
            };

            lastState = initialState;

            // 2. Stream the graph execution node by node
            yield { type: 'trace', data: ["GRAFO: Iniciando ejecución de nodos secuenciales..."] };
            yield { type: 'trace', data: ["PASO 1: Recuperación de contexto técnico (Buscando documentos)..."] };

            const streamChunks = await app.stream(initialState, {
                streamMode: "updates"
            });

            for await (const chunk of streamChunks) {
                const nodeName = Object.keys(chunk as any)[0];
                const updates = (chunk as any)[nodeName];

                // Feedback reactivo proactivo por nodo
                const nodeFeedback: Record<string, string> = {
                    'retrieve': 'PASO 2: Documentos recuperados. Iniciando validación de relevancia...',
                    'grade_documents': 'PASO 3: Validación completada. Verificando hechos técnicos...',
                    'transform_query': 'PASO 2.1: Re-enfocando búsqueda para mayor precisión...',
                    'generate': 'PASO 4: Información consolidada. Redactando respuesta técnica...',
                };

                if (nodeFeedback[nodeName]) {
                    yield { type: 'trace', data: [nodeFeedback[nodeName]] };
                }
                yield { type: 'trace', data: [`NODO_ACTIVO: Finalizado ${nodeName.toUpperCase()}.`] };

                // Update local state copy
                lastState = { ...lastState, ...updates };

                if (updates.trace) {
                    yield { type: 'trace', data: updates.trace };
                }
                if (updates.documents) {
                    yield { type: 'docs', data: updates.documents };
                }
            }

            // 3. Generation Logic (Real-time Text Streaming)
            if (!lastState.documents || lastState.documents.length === 0) {
                yield { type: 'trace', data: ["SISTEMA: No se encontraron documentos técnicos relevantes."] };
                const noDocsMessage = "No he encontrado información relevante en la base de conocimiento para responder a tu pregunta.\n\nPor favor, asegura que el documento solicitado está procesado.";
                const tokens = noDocsMessage.split(/(?=[ ])/g);
                for (const token of tokens) {
                    yield { type: 'token', data: token };
                    await new Promise(r => setTimeout(r, 10));
                }
                return;
            }

            yield { type: 'trace', data: ["GENERACIÓN: Iniciando streaming de respuesta final..."] };

            const context = lastState.documents.map((d: any) => d.text).join("\n\n---\n\n");
            const promptKey = history.length > 0 ? 'CHAT_RAG_GENERATOR' : 'RAG_GENERATOR';

            let genPrompt: string;
            let model: string = DEFAULT_MODEL;

            try {
                const rendered = await PromptService.getRenderedPrompt(
                    promptKey,
                    {
                        question,
                        context,
                        industry: lastState.industry || 'ELEVATORS',
                        history: JSON.stringify(history)
                    },
                    tenantId
                );
                genPrompt = rendered.text;
                model = rendered.model;
            } catch (err) {
                console.warn(`[AgenticRAGService.runStream] Fallback to Master Prompt:`, err);
                genPrompt = (PROMPTS as any)[promptKey]
                    .replace('{{question}}', question)
                    .replace('{{context}}', context)
                    .replace('{{history}}', JSON.stringify(history));
            }

            const stream = await callGeminiStream(genPrompt, tenantId, { correlationId, model });

            for await (const chunk of stream) {
                const text = chunk.text();
                if (text) {
                    yield { type: 'token', data: text };
                }
            }
            yield { type: 'connected', data: { status: 'complete' } };

        } catch (error: any) {
            console.error("[AgenticRAGService.runStream] Fatal Error:", error);
            yield {
                type: 'error',
                data: {
                    message: error.message || "Error interno del motor RAG",
                    trace: lastState?.trace
                }
            };
            throw error;
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
        industry: string = 'GENERIC',
        environment: string = 'PRODUCTION',
        filename?: string
    ) {
        const workflow = this.createWorkflow();
        const app = workflow.compile();

        const result = await app.invoke({
            question, history, tenantId, correlationId, retry_count: 0,
            industry, environment, filename,
            intensity: 'FAST', // Default
            documents: [], generation: "", is_grounded: false, is_useful: false, trace: []
        });

        // Iniciar evaluación asíncrona
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
