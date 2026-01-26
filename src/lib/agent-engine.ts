import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { RagResult, performTechnicalSearch } from "./rag-service";
import { extractModelsWithGemini, callGeminiMini } from "./llm";
import { logEvento } from "./logger";

/**
 * Representa el estado del agente durante el proceso de análisis.
 * Siguiendo la Phase 21 del Roadmap.
 */
export const AgentState = Annotation.Root({
    /**
     * Historial de mensajes de la conversación / traza
     */
    messages: Annotation<any[]>({
        reducer: (x, y) => x.concat(y),
    }),

    /**
     * Fragmentos de contexto recuperados del RAG
     */
    context_chunks: Annotation<RagResult[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),

    /**
     * Puntuación de confianza del análisis actual (0-1)
     */
    confidence_score: Annotation<number>({
        reducer: (x, y) => y ?? x,
        default: () => 0,
    }),

    /**
     * Referencias a otros idiomas si se detectó contenido multi-idioma
     */
    multilingual_refs: Annotation<string[]>({
        reducer: (x, y) => Array.from(new Set([...x, ...y])),
        default: () => [],
    }),

    /**
     * Hallazgos específicos (modelos, riesgos, etc)
     */
    findings: Annotation<any[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),

    /**
     * ID del pedido que se está analizando
     */
    pedidoId: Annotation<string>({
        reducer: (x, y) => y ?? x,
    }),

    /**
     * Tenant ID para aislamiento
     */
    tenantId: Annotation<string>({
        reducer: (x, y) => y ?? x,
    }),

    /**
     * Consultas de búsqueda adicionales generadas por el crítico
     */
    search_queries: Annotation<string[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),

    /**
     * ID de correlación para logs
     */
    correlacion_id: Annotation<string>({
        reducer: (x, y) => y ?? x,
    }),
});

export type AgentStateType = typeof AgentState.State;

/**
 * NODO: Extracción de Modelos
 * Utiliza Gemini Flash para identificar qué se está pidiendo.
 */
async function extractionNode(state: AgentStateType) {
    const { tenantId, correlacion_id } = state;
    const lastMessage = state.messages[state.messages.length - 1];
    const text = typeof lastMessage === 'string' ? lastMessage : lastMessage.content;

    const models = await extractModelsWithGemini(text, tenantId!, correlacion_id!);

    return {
        findings: models.map((m: any) => ({ ...m, source: 'extraction' })),
        messages: [{ role: 'assistant', content: `He detectado los siguientes componentes: ${models.map((m: any) => m.modelo).join(', ')}` }]
    };
}

/**
 * NODO: Búsqueda Técnica (RAG)
 * Recupera contexto relevante del corpus técnico basado en los modelos detectados.
 */
async function retrievalNode(state: AgentStateType) {
    const { findings, tenantId, correlacion_id, search_queries } = state;

    // Si tenemos queries específicas del crítico, las usamos. Si no, usamos las basadas en modelos.
    const queries = search_queries.length > 0
        ? [search_queries[search_queries.length - 1]]
        : findings.filter(f => f.source === 'extraction').map(m => `Especificaciones técnicas y normativa para ${m.tipo} modelo ${m.modelo}`);

    let allChunks: RagResult[] = [];

    for (const query of queries) {
        const chunks = await performTechnicalSearch(
            query,
            tenantId!,
            correlacion_id!,
            search_queries.length > 0 ? 5 : 3 // Más profundidad si es una búsqueda de corrección
        );
        allChunks = [...allChunks, ...chunks];
    }

    return {
        context_chunks: allChunks,
        messages: [{ role: 'assistant', content: `Retriever: He recuperado ${allChunks.length} fragmentos técnicos relevantes para: ${queries.join(', ')}` }]
    };
}

import { PromptService } from "./prompt-service";

/**
 * NODO: Validación de Riesgos
 * Analiza el cruce entre el pedido y el RAG para detectar incompatibilidades.
 */
async function riskAnalysisNode(state: AgentStateType) {
    const { context_chunks, findings, tenantId, correlacion_id } = state;

    const context = context_chunks.map(c => c.texto).join('\n---\n');
    const models = findings.filter(f => f.source === 'extraction').map(f => f.modelo).join(', ');

    // Renderizar prompt dinámico de riesgo para agente
    const renderedPrompt = await PromptService.renderPrompt(
        'AGENT_RISK_ANALYSIS',
        { context, models },
        tenantId!
    );

    const result = await callGeminiMini(renderedPrompt, tenantId!, { correlacion_id: correlacion_id! });

    try {
        const parsed = JSON.parse(result.match(/\{[\s\S]*\}/)?.[0] || '{}');
        return {
            findings: (parsed.riesgos || []).map((r: any) => ({ ...r, source: 'risk_analysis' })),
            confidence_score: parsed.confidence || 0.5,
            messages: [{ role: 'assistant', content: `Análisis de riesgos completado. Confianza: ${parsed.confidence}` }]
        };
    } catch (e) {
        return {
            messages: [{ role: 'assistant', content: "Error procesando el análisis de riesgos." }]
        };
    }
}

/**
 * NODO: Crítica y Corrección (Self-Correction)
 * Evalúa si el análisis es suficiente. Si la confianza es baja, decide re-intentar.
 */
import { MongoDBSaver } from "./agent-persistence";

async function critiqueNode(state: AgentStateType) {
    const { confidence_score, findings, messages, tenantId, correlacion_id } = state;

    // Si la confianza es alta, aprobamos
    if (confidence_score > 0.7) {
        return {
            messages: [{ role: 'assistant', content: `Crítico: Análisis validado con confianza ${confidence_score}.` }]
        };
    }

    // Si ya hemos reintentado demasiado
    const retryCount = messages.filter(m => m.content.includes("Refinando búsqueda")).length;
    if (retryCount >= 2) {
        return {
            messages: [{ role: 'assistant', content: `Crítico: Límite de reintentos alcanzado. Se entrega con las dudas detectadas.` }]
        };
    }

    // Generar nueva estrategia de búsqueda usando LLM para "Query Expansion"
    const lastRisks = findings.filter(f => f.source === 'risk_analysis').slice(-3);
    const expansionPrompt = `Como experto técnico de ascensores, analiza por qué la confianza del análisis es baja (${confidence_score}) basándote en estos riesgos detectados: ${JSON.stringify(lastRisks)}. 
    Genera una ÚNICA frase de búsqueda técnica para recuperar la normativa exacta que resolvería la duda.
    Responde solo con la frase de búsqueda.`;

    const expandedQuery = await callGeminiMini(expansionPrompt, tenantId!, { correlacion_id: correlacion_id! });

    return {
        search_queries: [expandedQuery.trim()],
        messages: [{ role: 'assistant', content: `Crítico: Baja confianza detectada. Refinando búsqueda con: "${expandedQuery.trim()}"` }],
    };
}

/**
 * Función condicional para el grafo
 */
function shouldContinue(state: AgentStateType) {
    const { confidence_score, messages } = state;
    const retryCount = messages.filter(m => m.role === 'assistant' && m.content.includes("Refinando búsqueda")).length;

    if (confidence_score <= 0.7 && retryCount < 2) {
        return "retrieve"; // Vuelve a buscar
    }
    return END;
}

const checkpointer = new MongoDBSaver();

const workflow = new StateGraph(AgentState)
    .addNode("extract", extractionNode)
    .addNode("retrieve", retrievalNode)
    .addNode("analyze_risks", riskAnalysisNode)
    .addNode("critique", critiqueNode) // Nuevo nodo
    .addEdge(START, "extract")
    .addEdge("extract", "retrieve")
    .addEdge("retrieve", "analyze_risks")
    .addEdge("analyze_risks", "critique")
    .addConditionalEdges(
        "critique",
        shouldContinue,
        {
            "retrieve": "retrieve",
            [END]: END
        }
    );

export const agentEngine = workflow.compile({ checkpointer: checkpointer as any });
