import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { z } from "zod";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { connectDB } from "@/lib/db";
import { logEvento } from "@/lib/logger";
import { DatabaseError, AppError } from "@/lib/errors";
import { UsageService } from "@/lib/usage-service";
import { trace, SpanStatusCode } from '@opentelemetry/api';

import { QueryExpansionService } from "./query-expansion-service";
import { RerankingService } from "./reranking-service";
import { SemanticCache } from "./semantic-cache";
import { VectorSearchService } from "./vector-search-service";
import { KeywordSearchService } from "./keyword-search-service";
import { MultilingualSearchService } from "./multilingual-search-service";

const tracer = trace.getTracer('abd-rag-platform');

export interface RagResult {
    text: string;
    source: string;
    score?: number;
    type: string;
    model: string;
    cloudinaryUrl?: string;
    language?: string;
    originalLang?: string;
    isShadow?: boolean;
    chunkType?: string;
    approxPage?: number;
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
 * Servicio RAG principal - Orquestador.
 */

/**
 * Búsqueda técnica avanzada usando MMR.
 */
export async function performTechnicalSearch(
    query: string,
    tenantId: string,
    correlationId: string,
    limit = 5,
    industry: string = 'ELEVATORS',
    environment: string = 'PRODUCTION'
): Promise<RagResult[]> {
    return tracer.startActiveSpan('rag.technical_search', {
        attributes: {
            'tenant.id': tenantId,
            'correlation.id': correlationId,
            'rag.query': query,
            'rag.limit': limit,
            'rag.strategy': 'MMR',
            'rag.environment': environment
        }
    }, async (span) => {
        try {
            PerformTechnicalSearchSchema.parse({ query, correlationId, limit });
            const inicio = Date.now();

            const db = await connectDB();
            const collection = db.collection('document_chunks');

            const embeddings = new GoogleGenerativeAIEmbeddings({
                apiKey: process.env.GEMINI_API_KEY,
                modelName: "text-embedding-004",
            });

            const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
                collection: collection as any,
                indexName: "vector_index",
                textKey: "chunkText",
                embeddingKey: "embedding",
            });

            const filter = {
                $and: [
                    { status: { $ne: "obsoleto" } },
                    { deletedAt: { $exists: false } },
                    { industry: industry },
                    { environment: environment },
                    {
                        $or: [
                            { tenantId: "global" },
                            { tenantId: tenantId }
                        ]
                    }
                ]
            };

            const results = await vectorStore.maxMarginalRelevanceSearch(query, {
                k: limit,
                fetchK: 20,
                filter: filter as any
            });

            const ragResults = results.map((doc) => ({
                text: doc.pageContent,
                source: doc.metadata.sourceDoc,
                score: (doc.metadata as any).score || 0.85,
                type: doc.metadata.componentType,
                model: doc.metadata.model,
                cloudinaryUrl: (doc.metadata as any).cloudinaryUrl,
                chunkType: doc.metadata.chunkType,
                approxPage: doc.metadata.approxPage
            }));

            const duracionTotal = Date.now() - inicio;
            span.setAttribute('rag.duration_ms', duracionTotal);

            await UsageService.trackVectorSearch(tenantId, correlationId);
            if (ragResults.length > 0) {
                const avgScore = ragResults.reduce((acc, curr) => acc + curr.score, 0) / ragResults.length;
                await UsageService.trackContextPrecision(tenantId, correlationId, avgScore, query);
            }

            span.setStatus({ code: SpanStatusCode.OK });
            return ragResults;

        } catch (error) {
            span.recordException(error as Error);
            span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
            throw new DatabaseError('Error en motor de búsqueda LangChain/Atlas', error as Error);
        } finally {
            span.end();
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
    limit = 5,
    environment: string = 'PRODUCTION'
): Promise<RagResult[]> {
    return tracer.startActiveSpan('rag.hybrid_search', {
        attributes: {
            'tenant.id': tenantId,
            'correlation.id': correlationId,
            'rag.query': query,
            'rag.strategy': 'RRF_HYBRID',
            'rag.environment': environment
        }
    }, async (span) => {
        const inicio = Date.now();
        try {
            const cachedResults = await SemanticCache.get(query, tenantId, environment, correlationId);
            if (cachedResults) return cachedResults;

            const { GraphRetrievalService } = await import('@/services/graph-retrieval-service');

            const [geminiResults, bgeResults, keywordResults, graphContext] = await Promise.all([
                performTechnicalSearch(query, tenantId, correlationId, limit * 3, 'ELEVATORS', environment),
                MultilingualSearchService.performMultilingualSearch(query, tenantId, correlationId, limit * 3, environment),
                KeywordSearchService.pureKeywordSearch(query, tenantId, correlationId, limit * 3, 'ELEVATORS', environment),
                GraphRetrievalService.getGraphContext(query, tenantId, correlationId)
            ]);

            let expandedResults: RagResult[] = [];
            try {
                const variations = await QueryExpansionService.expandQuery(query, tenantId, correlationId);
                const expansionPromises = variations.map((v: string) =>
                    performTechnicalSearch(v, tenantId, correlationId, limit, 'ELEVATORS', environment)
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

            addToMap(geminiResults, 1.2);
            addToMap(bgeResults, 0.8);
            addToMap(keywordResults, 1.5);
            addToMap(expandedResults, 1.0);

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

            const finalMerged = await RerankingService.rerankResults(query, potentialWinners, tenantId, correlationId, limit);

            span.setAttribute('rag.duration_ms', Date.now() - inicio);
            span.setStatus({ code: SpanStatusCode.OK });

            SemanticCache.set(query, finalMerged, tenantId, environment, correlationId).catch(console.error);

            return finalMerged;

        } catch (error) {
            span.recordException(error as Error);
            span.setStatus({ code: SpanStatusCode.ERROR });
            return performTechnicalSearch(query, tenantId, correlationId, limit);
        } finally {
            span.end();
        }
    });
}

/**
 * Proxies para otros motores de búsqueda
 */
export const performMultilingualSearch = MultilingualSearchService.performMultilingualSearch;
export const pureKeywordSearch = KeywordSearchService.pureKeywordSearch;
export const pureVectorSearch = VectorSearchService.pureVectorSearch;

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
    } catch (error) {
        throw error instanceof AppError ? error : new DatabaseError('Error retrieving relevant documents', error as Error);
    }
}
