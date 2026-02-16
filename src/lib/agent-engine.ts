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
    correlationId: Annotation<string>({
        reducer: (x, y) => y ?? x,
    }),

    /**
     * Insights federados (Vision 2027)
     */
    federated_insights: Annotation<any[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
});

export type AgentStateType = typeof AgentState.State;

/**
 * NODO: Extracción de Modelos
 * Utiliza Gemini Flash para identificar qué se está pidiendo.
 */
async function extractionNode(state: AgentStateType) {
    const { tenantId, correlationId: correlacion_id } = state;
    const lastMessage = state.messages[state.messages.length - 1];
    const text = typeof lastMessage === 'string' ? lastMessage : lastMessage.content;

    const models = await extractModelsWithGemini(text, tenantId!, correlacion_id!);

    return {
        findings: models.map((m: any) => ({ ...m, source: 'extraction' })),
        messages: [{ role: 'assistant', content: `He detectado los siguientes componentes: ${models.map((m: any) => m.model).join(', ')}` }]
    };
}

/**
 * NODO: Búsqueda Técnica (RAG)
 * Recupera contexto relevante del corpus técnico basado en los modelos detectados.
 */
async function retrievalNode(state: AgentStateType) {
    const { findings, tenantId, correlationId: correlacion_id, search_queries } = state;

    // Si tenemos queries específicas del crítico, las usamos. Si no, usamos las basadas en modelos.
    const queries = search_queries.length > 0
        ? [search_queries[search_queries.length - 1]]
        : findings.filter(f => f.source === 'extraction').map(m => `Especificaciones técnicas y normativa para ${m.type} modelo ${m.model}`);

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
    const { context_chunks, findings, tenantId, correlationId: correlacion_id, federated_insights } = state;

    const context = context_chunks.map(c => c.text).join('\n---\n');
    const globalPatterns = federated_insights?.map(p => `- PROBLEM: ${p.problemVector}\n  SOLUTION: ${p.solutionVector}`).join('\n') || 'No global patterns found.';
    const models = findings.filter(f => f.source === 'extraction').map(f => f.model).join(', ');

    // Renderizar prompt dinámico de riesgo para agente
    const renderedPrompt = await PromptService.getRenderedPrompt(
        'AGENT_RISK_ANALYSIS',
        {
            context,
            models,
            global_patterns: globalPatterns
        },
        tenantId!
    );

    const result = await callGeminiMini(renderedPrompt.text, tenantId!, { correlationId: correlacion_id! });

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
    const { confidence_score, findings, messages, tenantId, correlationId: correlacion_id } = state;

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

    const expandedQuery = await callGeminiMini(expansionPrompt, tenantId!, { correlationId: correlacion_id! });

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

import { FederatedKnowledgeService } from "./federated-knowledge-service";

/**
 * NODO: Descubrimiento Federado (Vision 2027)
 * Busca patrones técnicos en otros tenants de forma anónima para enriquecer el análisis.
 */
async function federatedDiscoveryNode(state: AgentStateType) {
    const { findings, tenantId, correlationId: correlacion_id } = state;

    // Usamos los modelos detectados para buscar patrones globales
    const queries = findings.filter(f => f.source === 'extraction').map(m => `${m.type} ${m.model}`);

    let allInsights: any[] = [];

    for (const query of queries) {
        const insights = await FederatedKnowledgeService.searchGlobalPatterns(
            query,
            tenantId!,
            correlacion_id!
        );
        allInsights = [...allInsights, ...insights];
    }

    return {
        federated_insights: allInsights,
        messages: [{
            role: 'assistant',
            content: `Federated Intelligence: He encontrado ${allInsights.length} patrones globales relevantes para este hardware.`
        }]
    };
}

/**
 * NODO: Análisis Causal (Phase 86)
 * Evalúa escenarios "What If" y efectos de segundo orden.
 */
async function causalAnalysisNode(state: AgentStateType) {
    const { context_chunks, tenantId, correlationId: correlacion_id, messages } = state;
    const lastMessage = messages[messages.length - 1];
    const scenario = typeof lastMessage === 'string' ? lastMessage : lastMessage.content;

    // Heurística simple: Solo activamos Causal AI si parece una pregunta de impacto
    // En producción esto usaría un clasificador de intenciones (Router)
    const isCausalQuery = /impact|chang|what if|si cambio|pasa si|riesgo/i.test(scenario);

    if (!isCausalQuery) {
        return {};
    }

    const context = context_chunks.map(c => c.text).join('\n---\n');

    try {
        const renderedPrompt = await PromptService.getRenderedPrompt(
            'CAUSAL_IMPACT_ANALYSIS',
            {
                scenario,
                context,
                industry: 'ELEVATORS'
            },
            tenantId!
        );

        const result = await callGeminiMini(renderedPrompt.text, tenantId!, { correlationId: correlacion_id! });
        const parsed = JSON.parse(result.match(/\{[\s\S]*\}/)?.[0] || '{}');

        return {
            findings: [{ ...parsed, source: 'causal_analysis' }],
            messages: [{ role: 'assistant', content: `Causal AI: Impacto ${parsed.impact} detectado. Riesgo: ${parsed.risk}.` }]
        };

    } catch (e) {
        // Fallo silencioso para no bloquear el flujo principal
        await logEvento({
            level: 'ERROR',
            source: 'AGENT_ENGINE',
            action: 'CAUSAL_ANALYSIS_ERROR',
            message: 'Error executing causal analysis',
            correlationId: correlacion_id!,
            tenantId: tenantId!
        });
        return {};
    }
}

const checkpointer = new MongoDBSaver();

const workflow = new StateGraph(AgentState)
    .addNode("extract", extractionNode)
    .addNode("retrieve", retrievalNode)
    .addNode("federated_discovery", federatedDiscoveryNode) // Nuevo Nodo Federado
    .addNode("analyze_risks", riskAnalysisNode)
    .addNode("analyze_causality", causalAnalysisNode) // Phase 86
    .addNode("critique", critiqueNode)
    .addEdge(START, "extract")
    .addEdge("extract", "retrieve")
    .addEdge("retrieve", "federated_discovery") // Flujo hacia red federada
    .addEdge("federated_discovery", "analyze_risks") // Unión de conocimiento local + global
    .addEdge("federated_discovery", "analyze_causality") // Parallel Causal Analysis
    .addEdge("analyze_risks", "critique")
    .addEdge("analyze_causality", "critique")
    .addConditionalEdges(
        "critique",
        shouldContinue,
        {
            "retrieve": "retrieve",
            [END]: END
        }
    );

export const agentEngine = workflow.compile({ checkpointer: checkpointer as any });
