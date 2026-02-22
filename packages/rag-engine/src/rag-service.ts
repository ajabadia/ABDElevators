
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { connectDB, logEvento } from "@abd/platform-core/server";
import { AppError, DatabaseError, AI_MODEL_IDS } from "@abd/platform-core";
import { UsageService } from "@/lib/usage-service";
import { trace, SpanStatusCode } from '@opentelemetry/api';

import { QueryExpansionService } from "./query-expansion";
import { RerankingService } from "./reranking";
import { SemanticCache } from "./semantic-cache";
import { VectorSearchService } from "./vector-search";
import { KeywordSearchService } from "./keyword-search";
import { MultilingualSearchService } from "./multilingual-search";
import { withSpan } from "@/lib/tracing";
import { PromptService } from "@/lib/prompt-service";
import { RagResult } from "./types";

const tracer = trace.getTracer('abd-rag-platform');

export type RAGIntensityMode = 'FAST' | 'DEEP' | 'KW_ONLY';

export interface SearchOptions {
    limit?: number;
    environment?: string;
    spaceId?: string;
    filename?: string;
    intensity?: RAGIntensityMode;
    onTrace?: (msg: string) => void;
}

const PerformTechnicalSearchSchema = z.object({
    query: z.string().min(1),
    correlationId: z.string().uuid(),
    limit: z.number().int().positive().optional()
});

const GetRelevantDocumentsSchema = z.object({
    entityId: z.string().min(1),
    topK: z.number().int().positive(),
    correlationId: z.string().uuid()
});

/**
 * Truncates context to fit within token budget (Approx 3k tokens)
 */
export function truncateContext(
    prompt: string,
    history: any[],
    chunks: RagResult[],
    maxTokens = 3000
): { history: any[]; chunks: RagResult[] } {
    let currentTokens = Math.ceil(prompt.length / 4);
    const resultChunks: RagResult[] = [];
    const resultHistory: any[] = [];

    // 1. Prioritize History (Reverse to keep latest)
    for (let i = history.length - 1; i >= 0; i--) {
        const msg = JSON.stringify(history[i]);
        const tokens = Math.ceil(msg.length / 4);
        if (currentTokens + tokens < 800) { // Limit history to ~800 tokens
            resultHistory.unshift(history[i]);
            currentTokens += tokens;
        } else break;
    }

    // 2. Chunks (Until budget)
    for (const chunk of chunks) {
        const tokens = Math.ceil(chunk.text.length / 4); // Changed chunk.chunkText to chunk.text
        if (currentTokens + tokens < maxTokens) {
            resultChunks.push(chunk);
            currentTokens += tokens;
        } else break;
    }

    return { history: resultHistory, chunks: resultChunks };
}

/**
 * Búsqueda técnica avanzada usando MMR.
 */
export async function performTechnicalSearch(
    query: string,
    tenantId: string,
    correlationId: string,
    limit = 5,
    industry: string = 'GENERIC',
    environment: string = 'PRODUCTION',
    spaceId?: string,
    filename?: string
): Promise<RagResult[]> {
    return withSpan('rag-service', 'rag.technical_search', async (span) => {
        span.setAttributes({
            'tenant.id': tenantId,
            'correlation.id': correlationId,
            'genai.model': AI_MODEL_IDS.EMBEDDING_1_0,
            'genai.text_length': query.length, // Assuming 'text' refers to 'query'
            'rag.query': query,
            'rag.limit': limit,
            'rag.strategy': 'MMR',
            'rag.environment': environment,
            'rag.industry': industry
        });

        PerformTechnicalSearchSchema.parse({ query, correlationId, limit });
        const inicio = Date.now();

        const db = await connectDB();
        const collection = db.collection('document_chunks');

        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GEMINI_API_KEY,
            modelName: AI_MODEL_IDS.EMBEDDING_1_0,
            apiVersion: "v1", // Phase 205 Fix: Use stable v1 API
        } as any);

        const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
            collection: collection as any,
            indexName: "vector_index",
            textKey: "chunkText",
            embeddingKey: "embedding",
        });

        const envFilter = environment === 'PRODUCTION' ? { $in: ['PRODUCTION', 'STAGING'] } : environment;

        const industryFilter = industry === 'GENERIC' ? { $exists: true } : { $in: [industry, 'GENERIC', null] };

        const filter: any = {
            $and: [
                { industry: industryFilter },
                { environment: envFilter },
                {
                    $or: [
                        { tenantId: "abd_global" },
                        { tenantId: "global" },
                        { tenantId: tenantId }
                    ]
                }
            ]
        };

        if (spaceId) {
            filter.$and.push({ spaceId });
        }

        if (filename) {
            filter.$and.push({ sourceDoc: filename });
        }

        const results = await vectorStore.maxMarginalRelevanceSearch(query, {
            k: limit,
            fetchK: 20,
            filter: filter as any
        });

        const sourceDocNames = Array.from(new Set(
            results
                .filter((d: any) => d.metadata && d.metadata.sourceDoc)
                .map((d: any) => d.metadata.sourceDoc)
        ));

        const assetsCollection = db.collection('knowledge_assets');
        const assets = await assetsCollection.find({
            filename: { $in: sourceDocNames },
            tenantId: { $in: ['abd_global', 'global', tenantId] }
        }).toArray();

        const contextMap = new Map(assets.map(a => [a.filename, a.contextHeader]));

        const parentChunkIds = results
            .filter((d: any) => d.metadata && d.metadata.parentChunkId)
            .map((d: any) => d.metadata.parentChunkId);

        const parentChunksMap = new Map<string, string>();
        if (parentChunkIds.length > 0) {
            const parentChunks = await collection.find({
                _id: { $in: parentChunkIds.map((id: string) => new ObjectId(id)) }
            }).toArray();
            parentChunks.forEach(pc => parentChunksMap.set(pc._id.toString(), pc.chunkText));
        }

        const ragResults = results.map((doc: any) => {
            const header = contextMap.get(doc.metadata.sourceDoc);
            const parentText = doc.metadata.parentChunkId ? parentChunksMap.get(doc.metadata.parentChunkId) : null;

            let enrichedText = header ? `[CONTEXTO: ${header}]\n\n${doc.pageContent}` : doc.pageContent;

            if (parentText) {
                enrichedText = `[CONTEXTO PADRE: ${parentText}]\n\n---\n\n${enrichedText}`;
            }

            return {
                text: enrichedText,
                source: doc.metadata.sourceDoc,
                score: (doc.metadata as any).score || 0.85,
                type: doc.metadata.componentType,
                model: doc.metadata.model,
                cloudinaryUrl: (doc.metadata as any).cloudinaryUrl,
                chunkType: doc.metadata.chunkType,
                approxPage: doc.metadata.approxPage,
                relatedAssets: assets.find(a => a.filename === doc.metadata.sourceDoc)?.relatedAssets || []
            };
        });

        const duracionTotal = Date.now() - inicio;
        span.setAttribute('rag.duration_ms', duracionTotal);

        await UsageService.trackVectorSearch(tenantId, correlationId);
        if (ragResults.length > 0) {
            const avgScore = ragResults.reduce((acc: number, curr: RagResult) => acc + (curr.score || 0), 0) / ragResults.length;
            await UsageService.trackContextPrecision(tenantId, correlationId, avgScore, query);
        }

        return ragResults;
    }, {
        attributes: {
            'tenant.id': tenantId,
            'correlation.id': correlationId
        }
    });
}

/**
 * Búsqueda Híbrida Calibrada (Orquestación).
 */
export async function hybridSearch(
    query: string,
    tenantId: string,
    correlationId: string,
    industry: string = 'GENERIC',
    options?: SearchOptions
): Promise<RagResult[]> {
    return withSpan('rag-service', 'rag.hybrid_search', async (span) => {
        const inicio = Date.now();
        const { limit = 4, environment = 'PRODUCTION', spaceId, filename, intensity = 'DEEP', onTrace } = options || {};

        span.setAttributes({
            'tenant.id': tenantId,
            'correlation.id': correlationId,
            'rag.query': query,
            'rag.strategy': 'RRF_HYBRID',
            'rag.environment': environment,
            'rag.industry': industry,
            'rag.intensity': intensity
        });

        if (onTrace) onTrace(`BUSQUEDA: Iniciando búsqueda (Modo: ${intensity})...`);

        // KW_ONLY branch: Skip vectors and embeddings
        if (intensity === 'KW_ONLY') {
            if (onTrace) onTrace("BUSQUEDA: Modo Keyword-Only activo. Saltando búsqueda vectorial.");
            return await KeywordSearchService.pureKeywordSearch(query, tenantId, correlationId, limit, industry, environment, spaceId, filename);
        }

        const cachedResults = await SemanticCache.get(query, tenantId, environment, correlationId);
        if (cachedResults) {
            span.setAttribute('rag.cache_hit', true);
            if (onTrace) onTrace("CACHE: Recuperada respuesta previa de caché semántica.");
            return cachedResults;
        }

        let effectiveIndustry = industry;
        if (industry === 'ELEVATORS' || industry === 'GENERIC') {
            if (onTrace) onTrace("DETERMINACIÓN: Clasificando vertical de la consulta...");
            const { DomainRouterService } = await import("@/services/domain-router-service");
            const detected = await DomainRouterService.classifyQuery(query, tenantId, correlationId);
            if (detected !== 'GENERIC') {
                effectiveIndustry = detected;
                span.setAttribute('rag.detected_industry', detected);
            }
        }

        const { GraphRetrievalService } = await import('@/services/graph-retrieval-service');

        let hydeQuery = query;
        try {
            if (onTrace) onTrace("HYDE: Generando respuesta hipotética para mejorar búsqueda semántica...");
            const { callGeminiMini } = await import('@/lib/llm');
            const { text: hydePrompt } = await PromptService.getRenderedPrompt('RAG_HYDE_GENERATOR', { query }, tenantId);
            const hypotheticalAnswer = await callGeminiMini(hydePrompt, tenantId, { correlationId, temperature: 0.1 });
            hydeQuery = `${query}\n\n[HYDE]: ${hypotheticalAnswer}`;
            span.setAttribute('rag.hyde_enabled', true);
        } catch (e) {
            console.warn("[HYDE GENERATION FAILED] Falling back to original query.", e);
        }

        if (onTrace) onTrace("BUSQUEDA: Iniciando búsqueda técnica, multilingüe y de palabras clave...");

        const TIMEOUT_MS = 15000;
        const withTimeout = (promise: Promise<any>, branchName: string) => {
            return Promise.race([
                promise,
                new Promise((_, reject) => setTimeout(() => reject(new Error(`TIMEOUT: ${branchName} excedió los ${TIMEOUT_MS}ms`)), TIMEOUT_MS))
            ]);
        };

        const searchPromises = [
            withTimeout(performTechnicalSearch(hydeQuery, tenantId, correlationId, limit * 3, effectiveIndustry, environment, spaceId, filename), 'TECHNICAL'),
            withTimeout(MultilingualSearchService.performMultilingualSearch(hydeQuery, tenantId, correlationId, limit * 3, effectiveIndustry, environment, spaceId, filename), 'MULTILINGUAL'),
            withTimeout(KeywordSearchService.pureKeywordSearch(query, tenantId, correlationId, limit * 3, effectiveIndustry, environment, spaceId, filename), 'KEYWORD'),
            withTimeout(GraphRetrievalService.getGraphContext(query, tenantId, correlationId), 'GRAPH')
        ];

        const settledResults = await Promise.allSettled(searchPromises);

        const geminiResults = (settledResults[0].status === 'fulfilled' ? settledResults[0].value : []) as RagResult[];
        const bgeResults = (settledResults[1].status === 'fulfilled' ? settledResults[1].value : []) as RagResult[];
        const keywordResults = (settledResults[2].status === 'fulfilled' ? settledResults[2].value : []) as RagResult[];
        const graphContext = (settledResults[3].status === 'fulfilled' ? settledResults[3].value : null) as any;

        // Log failures and timeouts for visibility
        settledResults.forEach((res, idx) => {
            if (res.status === 'rejected') {
                const branchMap = ['TECHNICAL', 'MULTILINGUAL', 'KEYWORD', 'GRAPH'];
                const branchName = branchMap[idx];
                console.warn(`[HybridSearch] Branch ${branchName} failed or timed out:`, res.reason);
                logEvento({
                    level: 'WARN',
                    source: 'RAG_HYBRID_SEARCH',
                    action: 'BRANCH_FAILURE',
                    message: `${branchName} branch issue: ${res.reason?.message || 'Unknown error'}`,
                    correlationId,
                    tenantId,
                    details: { branch: branchName, error: res.reason?.message }
                }).catch(() => { });
                if (onTrace) onTrace(`WARNING: Rama ${branchName} no respondió a tiempo o falló. Continuando con el resto.`);
            }
        });

        let expandedResults: RagResult[] = [];
        try {
            if (onTrace) onTrace("EXPANSIÓN: Diversificando consulta para encontrar más contextos...");
            const variations = await QueryExpansionService.expandQuery(query, tenantId, correlationId);
            const expansionPromises = variations.map((v: string) =>
                performTechnicalSearch(v, tenantId, correlationId, limit, effectiveIndustry, environment, spaceId, filename)
            );
            const expansionHits = await Promise.all(expansionPromises);
            expandedResults = expansionHits.flat();
        } catch (e) {
            console.warn("[QUERY EXPANSION FAILED]", e);
        }

        const map = new Map<string, RagResult & { rankScore: number }>();
        const addToMap = (results: RagResult[], weight: number) => {
            results.forEach((res, index) => {
                const key = res.text.substring(0, 150);
                const existing = map.get(key);
                const score = weight * (1 / (index + 60));
                if (existing) {
                    existing.rankScore += score;
                } else {
                    map.set(key, { ...res, rankScore: score });
                }
            });
        };

        // Phase 209: BGE is now primary, Keyword has strong weight for exact matches
        addToMap(geminiResults, 1.0);
        addToMap(bgeResults, 1.2); // BGE weight increased
        addToMap(keywordResults, 1.5);
        addToMap(expandedResults, 0.8);

        const potentialWinners = Array.from(map.values())
            .sort((a, b) => b.rankScore - a.rankScore)
            .slice(0, 15);

        if (graphContext && graphContext.textSummary) {
            potentialWinners.unshift({
                text: graphContext.textSummary,
                source: "KNOWLEDGE_GRAPH",
                score: 1.0,
                type: "GRAPH_CONTEXT",
                model: "NEO4J",
                rankScore: 999
            });
        }

        if (onTrace) onTrace(`RERANKING: Calibrando relevancia de ${potentialWinners.length} fragmentos encontrados...`);
        const finalMerged = await RerankingService.rerankResults(query, potentialWinners, tenantId, correlationId, limit, effectiveIndustry);

        span.setAttribute('rag.duration_ms', Date.now() - inicio);
        SemanticCache.set(query, finalMerged, tenantId, environment, correlationId).catch(console.error);

        return finalMerged;
    }, {
        attributes: {
            'tenant.id': tenantId,
            'correlation.id': correlationId
        }
    });
}

/**
 * Obtener documentos relevantes para una entidad.
 */
export async function getRelevantDocuments(
    entityId: string,
    tenantId: string,
    options: { topK: number; correlationId: string }
): Promise<{ id: string; content: string }[]> {
    GetRelevantDocumentsSchema.parse({ entityId, ...options });
    const { topK, correlationId } = options;
    try {
        const db = await connectDB();
        const entity = await db.collection('entities').findOne({ _id: new (await import("mongodb")).ObjectId(entityId) });
        if (!entity || (entity.tenantId && entity.tenantId !== tenantId)) {
            throw new AppError('NOT_FOUND', 404, `Entity not found or access denied`);
        }
        const entityText = entity.originalText || "";
        if (!entityText) return [];
        const results = await performTechnicalSearch(entityText, tenantId, correlationId, topK);
        return results.map((r, index) => ({ id: `doc_${index}`, content: r.text }));
    } catch (error: any) {
        throw error instanceof AppError ? error : new DatabaseError('Error retrieving relevant documents', error as Error);
    }
}
