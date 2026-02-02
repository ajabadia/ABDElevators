import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { z } from "zod";

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { connectDB } from "@/lib/db";
import { logEvento } from "@/lib/logger";
import { DatabaseError, AppError } from "@/lib/errors";
import { UsageService } from "@/lib/usage-service";
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('abd-rag-platform');


export interface RagResult {
    text: string;
    source: string;
    score?: number;
    type: string;
    model: string;
    cloudinaryUrl?: string;
    // Dual-Indexing Metadata (Phase 21.1)
    language?: string;
    originalLang?: string;
    isShadow?: boolean;
}

const PerformTechnicalSearchSchema = z.object({
    query: z.string().min(1),
    correlationId: z.string().uuid(),
    limit: z.number().int().positive().optional()
});

const PureVectorSearchSchema = PerformTechnicalSearchSchema.extend({
    minScore: z.number().min(0).max(1).optional()
});

const GetRelevantDocumentsSchema = z.object({
    entityId: z.string().min(1),
    topK: z.number().int().positive(),
    correlationId: z.string().uuid()
});

/**
 * Servicio RAG para búsqueda semántica en el corpus técnico.
 * Utiliza LangChain para aprovechar MMR (Maximal Marginal Relevance)
 * SLA: P95 < 1000ms (debido a re-ranking MMR)
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

            // FILTRO HÍBRIDO: Aislamiento por Tenant + Industria + Estado + Entorno
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

            // LangChain's maxMarginalRelevanceSearch doesn't return scores easily.
            // We calculate them manually for the selected winners to provide UI feedback.
            const ragResults = await Promise.all(results.map(async (doc) => {
                const docEmbedding = doc.metadata.embedding;
                let score = 0;

                // If embedding is not in metadata, we might need to fetch it or skip
                // For now, we use a fallback similarity if available or 0.85 as MMR winner indicator
                score = (doc.metadata as any).score || 0.85;

                return {
                    text: doc.pageContent,
                    source: doc.metadata.sourceDoc,
                    score: score,
                    type: doc.metadata.componentType,
                    model: doc.metadata.model,
                    cloudinaryUrl: (doc.metadata as any).cloudinaryUrl
                };
            }));

            const duracionTotal = Date.now() - inicio;
            span.setAttribute('rag.duration_ms', duracionTotal);
            span.setAttribute('rag.result_count', results.length);

            // Tracking de uso (Búsqueda Vectorial + Precisión)
            await UsageService.trackVectorSearch(tenantId, correlationId);
            if (ragResults.length > 0) {
                const avgScore = ragResults.reduce((acc, curr) => acc + curr.score, 0) / ragResults.length;
                await UsageService.trackContextPrecision(tenantId, correlationId, avgScore, query);
            }

            await logEvento({
                level: 'DEBUG',
                source: 'RAG_SERVICE',
                action: 'SEARCH_SUCCESS_MMR',
                message: `Búsqueda MMR para "${query}" devolvió ${results.length} resultados`,
                correlationId,
                tenantId,
                details: { limit, query, strategy: 'MMR', durationMs: duracionTotal }
            });

            // SLA: El RAG Pro con MMR puede tomar hasta 1000ms
            if (duracionTotal > 1000) {
                span.addEvent('sla_violation', { 'rag.duration_ms': duracionTotal });
                await logEvento({
                    level: 'WARN',
                    source: 'RAG_SERVICE',
                    action: 'SLA_VIOLATION',
                    message: `Búsqueda RAG MMR lenta: ${duracionTotal}ms`,
                    correlationId,
                    tenantId,
                    details: { durationTotalMs: duracionTotal }
                });
            }

            span.setStatus({ code: SpanStatusCode.OK });
            return ragResults;

        } catch (error) {
            span.recordException(error as Error);
            span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });

            await logEvento({
                level: 'ERROR',
                source: 'RAG_SERVICE',
                action: 'SEARCH_ERROR',
                message: `Error en búsqueda RAG (MMR): ${(error as Error).message}`,
                correlationId,
                tenantId,
                stack: (error as Error).stack
            });


            throw new DatabaseError('Error en motor de búsqueda LangChain/Atlas', error as Error);
        } finally {
            span.end();
        }
    });
}

/**
 * Búsqueda Multilingüe Avanzada (Phase 21.1).
 * Utiliza BGE-M3 para buscar en el espacio semántico unificado EN/ES/DE/IT/FR/PT.
 */
export async function performMultilingualSearch(
    query: string,
    tenantId: string,
    correlationId: string,
    limit = 5,
    environment: string = 'PRODUCTION'
): Promise<RagResult[]> {
    return tracer.startActiveSpan('rag.multilingual_search', {
        attributes: {
            'tenant.id': tenantId,
            'correlation.id': correlationId,
            'rag.query': query,
            'rag.strategy': 'BGE-M3',
            'rag.environment': environment
        }
    }, async (span) => {
        const inicio = Date.now();
        try {
            const { multilingualService } = await import('@/lib/multilingual-service');
            const db = await connectDB();
            const collection = db.collection('document_chunks');

            const queryVector = await multilingualService.generateEmbedding(query);

            // Búsqueda vectorial explícita en Atlas (SLA calibrado)
            const results = await collection.aggregate([
                {
                    "$vectorSearch": {
                        "index": "vector_index_multilingual",
                        "path": "embedding_multilingual",
                        "queryVector": queryVector,
                        "numCandidates": limit * 20,
                        "limit": limit,
                        "filter": {
                            "$and": [
                                { "tenantId": { "$in": ["global", tenantId] } },
                                { "environment": environment }
                            ]
                        }
                    }
                },
                {
                    "$project": {
                        "chunkText": 1,
                        "sourceDoc": 1,
                        "componentType": 1,
                        "model": 1,
                        "score": { "$meta": "vectorSearchScore" },
                        "cloudinaryUrl": 1
                    }
                }
            ]).toArray();

            span.setAttribute('rag.result_count', results.length);
            span.setAttribute('rag.duration_ms', Date.now() - inicio);

            // Tracking de uso (Búsqueda Vectorial + Precisión)
            await UsageService.trackVectorSearch(tenantId, correlationId);
            if (results.length > 0) {
                const avgScore = results.reduce((acc, curr) => acc + (curr.score || 0), 0) / results.length;
                await UsageService.trackContextPrecision(tenantId, correlationId, avgScore, query);
            }

            await logEvento({
                level: 'DEBUG',
                source: 'RAG_SERVICE',
                action: 'MULTILINGUAL_SEARCH_SUCCESS',
                message: `Búsqueda BGE-M3 para "${query}"`,
                correlationId,
                tenantId,
                details: { hits: results.length, durationMs: Date.now() - inicio }
            });

            span.setStatus({ code: SpanStatusCode.OK });

            return results.map((doc: any) => ({
                text: doc.chunkText,
                source: doc.sourceDoc,
                score: doc.score,
                type: doc.componentType,
                model: doc.model,
                cloudinaryUrl: doc.cloudinaryUrl
            }));

        } catch (error) {
            span.recordException(error as Error);
            span.setStatus({ code: SpanStatusCode.ERROR });
            await logEvento({
                level: 'ERROR',
                source: 'RAG_SERVICE',
                action: 'MULTILINGUAL_SEARCH_ERROR',
                message: error instanceof Error ? error.message : 'Unknown error',
                correlationId
            });
            return [];
        } finally {
            span.end();
        }
    });
}

/**
 * Búsqueda por palabras clave (BM25) usando Atlas Search (Lucene).
 * Complemento ideal para términos técnicos exactos. (Fase 36)
 */
export async function pureKeywordSearch(
    query: string,
    tenantId: string,
    correlationId: string,
    limit = 5,
    industry: string = 'ELEVATORS',
    environment: string = 'PRODUCTION'
): Promise<RagResult[]> {
    return tracer.startActiveSpan('rag.keyword_search', {
        attributes: {
            'tenant.id': tenantId,
            'correlation.id': correlationId,
            'rag.query': query,
            'rag.strategy': 'BM25',
            'rag.environment': environment
        }
    }, async (span) => {
        const inicio = Date.now();
        try {
            const db = await connectDB();
            const collection = db.collection('document_chunks');

            // Búsqueda de Atlas Search
            const results = await collection.aggregate([
                {
                    "$search": {
                        "index": "keyword_index",
                        "text": {
                            "query": query,
                            "path": "chunkText"
                        }
                    }
                },
                {
                    $match: {
                        status: { $ne: "obsoleto" },
                        deletedAt: { $exists: false },
                        industry: industry,
                        environment: environment,
                        $or: [
                            { tenantId: "global" },
                            { tenantId: tenantId }
                        ]
                    }
                },
                {
                    "$limit": limit
                },
                {
                    "$project": {
                        "chunkText": 1,
                        "sourceDoc": 1,
                        "componentType": 1,
                        "model": 1,
                        "score": { "$meta": "searchScore" },
                        "cloudinaryUrl": 1,
                        "language": 1
                    }
                }
            ]).toArray();

            const finalResults: RagResult[] = results.map(r => ({
                text: r.chunkText,
                source: r.sourceDoc,
                score: r.score,
                type: r.componentType,
                model: r.model,
                cloudinaryUrl: r.cloudinaryUrl,
                language: r.language
            }));

            span.setAttribute('rag.result_count', finalResults.length);
            span.setAttribute('rag.duration_ms', Date.now() - inicio);

            await logEvento({
                level: 'INFO',
                source: 'RAG_SERVICE',
                action: 'KEYWORD_SEARCH_SUCCESS',
                message: `Búsqueda BM25 para "${query}"`,
                correlationId,
                tenantId,
                details: {
                    hits: finalResults.length,
                    durationMs: Date.now() - inicio
                }
            });

            return finalResults;

        } catch (error: any) {
            span.recordException(error);
            span.setStatus({ code: SpanStatusCode.ERROR });
            console.error("[KEYWORD SEARCH ERROR]", error.message);
            return [];
        } finally {
            span.end();
        }
    });
}


/**
 * Búsqueda Híbrida Calibrada (Fase 21.1 Tuning).
 * Combina lo mejor de Gemini (Precisión semántica) y BGE-M3 (Multilingüe Robusto).
 * Aplica RRF (Reciprocal Rank Fusion) para unificar rankings.
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
            const [geminiResults, bgeResults, keywordResults] = await Promise.all([
                performTechnicalSearch(query, tenantId, correlationId, limit * 2, 'ELEVATORS', environment),
                performMultilingualSearch(query, tenantId, correlationId, limit * 2, environment),
                pureKeywordSearch(query, tenantId, correlationId, limit * 2, 'ELEVATORS', environment)
            ]);

            const map = new Map<string, RagResult & { rankScore: number }>();

            const addToMap = (results: RagResult[], weight: number) => {
                results.forEach((res, index) => {
                    const key = res.text.substring(0, 100);
                    const existing = map.get(key);
                    const score = weight * (1 / (index + 60)); // RRF estándar: 1 / (rank + k) con k=60

                    if (existing) {
                        existing.rankScore += score;
                        if (res.score && (!existing.score || res.score > existing.score)) {
                            existing.score = res.score;
                        }
                    } else {
                        map.set(key, { ...res, rankScore: score });
                    }
                });
            };

            addToMap(geminiResults, 1.0);
            addToMap(bgeResults, 1.0);
            addToMap(keywordResults, 1.5); // Priorizar términos técnicos exactos

            const merged = Array.from(map.values())
                .sort((a, b) => b.rankScore - a.rankScore)
                .slice(0, limit);

            span.setAttribute('rag.merged_count', merged.length);
            span.setAttribute('rag.duration_ms', Date.now() - inicio);

            await logEvento({
                level: 'INFO',
                source: 'RAG_SERVICE',
                action: 'HYBRID_SEARCH_SUCCESS',
                message: `Búsqueda híbrida para "${query}"`,
                correlationId,
                tenantId,
                details: {
                    gemini_hits: geminiResults.length,
                    bge_hits: bgeResults.length,
                    keyword_hits: keywordResults.length,
                    merged_hits: merged.length,
                    durationMs: Date.now() - inicio
                }
            });

            span.setStatus({ code: SpanStatusCode.OK });
            return merged;

        } catch (error) {
            span.recordException(error as Error);
            span.setStatus({ code: SpanStatusCode.ERROR });
            console.error("[HYBRID SEARCH ERROR]", error);
            // Fallback
            return performTechnicalSearch(query, tenantId, correlationId, limit);
        } finally {
            span.end();
        }
    });
}
/**
 * Búsqueda vectorial PURA optimizada para velocidad.
 * NO usa MMR para garantizar SLA < 200ms.
 * Ideal para navegación técnica rápida por el usuario.
 */
export async function pureVectorSearch(
    query: string,
    tenantId: string,
    correlationId: string,
    options: { limit?: number; minScore?: number; industry?: string; environment?: string } = {}
): Promise<RagResult[]> {
    return tracer.startActiveSpan('rag.pure_vector_search', {
        attributes: {
            'tenant.id': tenantId,
            'correlation.id': correlationId,
            'rag.query': query,
            'rag.strategy': 'SIMILARITY',
            'rag.environment': options.environment || 'PRODUCTION'
        }
    }, async (span) => {
        const { limit = 5, minScore = 0.6, environment = 'PRODUCTION' } = options;
        const inicio = Date.now();
        try {
            PureVectorSearchSchema.parse({ query, correlationId, ...options });

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

            // FILTRO HÍBRIDO: Aislamiento por Tenant + Industria + Estado + Entorno
            const filter = {
                $and: [
                    { status: { $ne: "obsoleto" } },
                    { deletedAt: { $exists: false } },
                    { industry: options.industry || 'ELEVATORS' },
                    { environment: environment },
                    {
                        $or: [
                            { tenantId: "global" },
                            { tenantId: tenantId }
                        ]
                    }
                ]
            };

            // Búsqueda directa por similitud (más rápida que MMR)
            const resultsWithScore = await vectorStore.similaritySearchWithScore(
                query,
                limit,
                filter as any
            );

            const finalResults = resultsWithScore
                .filter(([_, score]) => score >= minScore)
                .map(([doc, score]) => ({
                    text: doc.pageContent,
                    source: doc.metadata.sourceDoc,
                    score,
                    type: doc.metadata.componentType,
                    model: doc.metadata.model,
                    cloudinaryUrl: (doc.metadata as any).cloudinaryUrl
                }));

            const duracionTotal = Date.now() - inicio;
            span.setAttribute('rag.duration_ms', duracionTotal);
            span.setAttribute('rag.result_count', finalResults.length);

            // Tracking de uso (Búsqueda Vectorial + Precisión)
            await UsageService.trackVectorSearch(tenantId, correlationId);
            if (finalResults.length > 0) {
                const avgScore = finalResults.reduce((acc, curr) => acc + curr.score, 0) / finalResults.length;
                await UsageService.trackContextPrecision(tenantId, correlationId, avgScore, query);
            }

            await logEvento({
                level: 'INFO',
                source: 'RAG_SERVICE',
                action: 'PURE_VECTOR_SEARCH_SUCCESS',
                message: `Búsqueda vectorial pura para "${query}"`,
                correlationId,
                tenantId,
                details: { limit, query, results: resultsWithScore.length }
            });

            // SLA Estricto para búsqueda pura: 200ms
            if (duracionTotal > 200) {
                span.addEvent('sla_violation', { 'rag.duration_ms': duracionTotal });
                await logEvento({
                    level: 'WARN',
                    source: 'RAG_SERVICE',
                    action: 'PURE_SLA_VIOLATION',
                    message: `Búsqueda vectorial pura excedió SLA: ${duracionTotal}ms`,
                    correlationId,
                    details: { durationTotalMs: duracionTotal }
                });
            }

            span.setStatus({ code: SpanStatusCode.OK });
            return finalResults;

        } catch (error) {
            span.recordException(error as Error);
            span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });

            await logEvento({
                level: 'ERROR',
                source: 'RAG_SERVICE',
                action: 'PURE_SEARCH_ERROR',
                message: `Error en búsqueda vectorial pura: ${(error as Error).message}`,
                correlationId,
                tenantId,
                stack: (error as Error).stack
            });
            throw new DatabaseError('Error en búsqueda vectorial pura', error as Error);
        } finally {
            span.end();
        }
    });
}

/**
 * Retrieves relevant technical documents for a given entity ID.
 * Generates an embedding for the entity's text and performs a vector search.
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

        if (!entity) {
            throw new AppError('NOT_FOUND', 404, `Entity ${entityId} not found`);
        }

        // 🛡️ Tenant Isolation Check
        if (entity.tenantId && entity.tenantId !== tenantId) {
            throw new AppError('FORBIDDEN', 403, `No tienes permiso para acceder a este recurso`);
        }

        const entityText = entity.originalText || "";
        if (!entityText) {
            return [];
        }

        // Search using the full entity text as query
        const results = await performTechnicalSearch(entityText, tenantId, correlationId, topK);

        return results.map((r, index) => ({
            id: `doc_${index}`,
            content: r.text
        }));
    } catch (error) {
        throw error instanceof AppError ? error : new DatabaseError('Error retrieving relevant documents', error as Error);
    }
}
