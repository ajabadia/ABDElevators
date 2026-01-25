import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { z } from "zod";

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { connectDB } from "@/lib/db";
import { logEvento } from "@/lib/logger";
import { DatabaseError, AppError } from "@/lib/errors";
import { UsageService } from "@/lib/usage-service";

export interface RagResult {
    texto: string;
    source: string;
    score?: number;
    tipo: string;
    modelo: string;
}

const PerformTechnicalSearchSchema = z.object({
    query: z.string().min(1),
    correlacion_id: z.string().uuid(),
    limit: z.number().int().positive().optional()
});

const PureVectorSearchSchema = PerformTechnicalSearchSchema.extend({
    min_score: z.number().min(0).max(1).optional()
});

const GetRelevantDocumentsSchema = z.object({
    pedidoId: z.string().min(1),
    topK: z.number().int().positive(),
    correlacion_id: z.string().uuid()
});

/**
 * Servicio RAG para búsqueda semántica en el corpus técnico.
 * Utiliza LangChain para aprovechar MMR (Maximal Marginal Relevance)
 * SLA: P95 < 1000ms (debido a re-ranking MMR)
 */
export async function performTechnicalSearch(
    query: string,
    tenantId: string,
    correlacion_id: string,
    limit = 5,
    industry: string = 'ELEVATORS'
): Promise<RagResult[]> {
    PerformTechnicalSearchSchema.parse({ query, correlacion_id, limit });
    const inicio = Date.now();

    try {
        const db = await connectDB();
        const collection = db.collection('document_chunks');

        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GEMINI_API_KEY,
            modelName: "text-embedding-004",
        });

        const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
            collection: collection as any,
            indexName: "vector_index",
            textKey: "texto_chunk",
            embeddingKey: "embedding",
        });

        // FILTRO HÍBRIDO: Aislamiento por Tenant + Industria + Estado
        const filter = {
            $and: [
                { estado: { $ne: "obsoleto" } },
                { industry: industry },
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

        // Tracking de uso (Búsqueda Vectorial)
        await UsageService.trackVectorSearch(tenantId, correlacion_id);

        await logEvento({
            nivel: 'DEBUG',
            origen: 'RAG_SERVICE',
            accion: 'SEARCH_SUCCESS_MMR',
            mensaje: `Búsqueda MMR para "${query}" devolvió ${results.length} resultados`,
            correlacion_id,
            tenantId,
            materiaId: 'ELEVATORS',
            detalles: { limit, query, strategy: 'MMR' }
        });

        return results.map(doc => ({
            texto: doc.pageContent,
            source: doc.metadata.origen_doc,
            score: 0, // MMR de LangChain no devuelve score directo fácilmente en esta firma
            tipo: doc.metadata.tipo_componente,
            modelo: doc.metadata.modelo
        }));

    } catch (error) {
        await logEvento({
            nivel: 'ERROR',
            origen: 'RAG_SERVICE',
            accion: 'SEARCH_ERROR',
            mensaje: `Error en búsqueda RAG (MMR): ${(error as Error).message}`,
            correlacion_id,
            tenantId,
            materiaId: 'ELEVATORS',
            stack: (error as Error).stack
        });


        throw new DatabaseError('Error en motor de búsqueda LangChain/Atlas', error as Error);
    } finally {
        const duracionTotal = Date.now() - inicio;

        // SLA: El RAG Pro con MMR puede tomar hasta 1000ms
        if (duracionTotal > 1000) {
            await logEvento({
                nivel: 'WARN',
                origen: 'RAG_SERVICE',
                accion: 'SLA_VIOLATION',
                mensaje: `Búsqueda RAG MMR lenta: ${duracionTotal}ms`,
                correlacion_id,
                tenantId,
                materiaId: 'ELEVATORS',
                detalles: { duracion_total_ms: duracionTotal }
            });
        }
    }
}

/**
 * Búsqueda Multilingüe Avanzada (Phase 21.1).
 * Utiliza BGE-M3 para buscar en el espacio semántico unificado EN/ES/DE/IT/FR.
 * Requiere que los documentos hayan sido indexados con Dual-Indexing.
 */
export async function performMultilingualSearch(
    query: string,
    tenantId: string,
    correlacion_id: string,
    limit = 5
): Promise<RagResult[]> {
    const inicio = Date.now();
    try {
        const { multilingualService } = await import('@/lib/multilingual-service');
        const db = await connectDB();
        const collection = db.collection('document_chunks');

        // Generar vector con BGE-M3
        const queryVector = await multilingualService.generateEmbedding(query);

        // Búsqueda vectorial explícita en Atlas usando el índice secundario 'vector_index_multilingual'
        // (Nota: Debes crear este índice en Atlas apuntando a 'embedding_multilingual')
        const results = await collection.aggregate([
            {
                "$vectorSearch": {
                    "index": "vector_index_multilingual",
                    "path": "embedding_multilingual",
                    "queryVector": queryVector,
                    "numCandidates": limit * 10,
                    "limit": limit,
                    "filter": {
                        "tenantId": { "$in": ["global", tenantId] }
                    }
                }
            },
            {
                "$project": {
                    "texto_chunk": 1,
                    "origen_doc": 1,
                    "tipo_componente": 1,
                    "modelo": 1,
                    "score": { "$meta": "vectorSearchScore" }
                }
            }
        ]).toArray();

        await logEvento({
            nivel: 'INFO',
            origen: 'RAG_SERVICE',
            accion: 'MULTILINGUAL_SEARCH_SUCCESS',
            mensaje: `Búsqueda BGE-M3 para "${query}"`,
            correlacion_id,
            tenantId,
            detalles: { hits: results.length }
        });

        return results.map((doc: any) => ({
            texto: doc.texto_chunk,
            source: doc.origen_doc,
            score: doc.score,
            tipo: doc.tipo_componente,
            modelo: doc.modelo
        }));

    } catch (error) {
        await logEvento({
            nivel: 'ERROR',
            origen: 'RAG_SERVICE',
            accion: 'MULTILINGUAL_SEARCH_ERROR',
            mensaje: error instanceof Error ? error.message : 'Unknown error',
            correlacion_id
        });
        return []; // Fallback a vacío si falla el modelo pesado
    }
}
/**
 * Búsqueda vectorial PURA optimizada para velocidad.
 * NO usa MMR para garantizar SLA < 200ms.
 * Ideal para navegación técnica rápida por el usuario.
 */
export async function pureVectorSearch(
    query: string,
    tenantId: string,
    correlacion_id: string,
    options: { limit?: number; min_score?: number; industry?: string } = {}
): Promise<RagResult[]> {
    PureVectorSearchSchema.parse({ query, correlacion_id, ...options });
    const { limit = 5, min_score = 0.6 } = options;
    const inicio = Date.now();

    try {
        const db = await connectDB();
        const collection = db.collection('document_chunks');

        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GEMINI_API_KEY,
            modelName: "text-embedding-004",
        });

        const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
            collection: collection as any,
            indexName: "vector_index",
            textKey: "texto_chunk",
            embeddingKey: "embedding",
        });

        // FILTRO HÍBRIDO: Aislamiento por Tenant + Industria + Estado
        const filter = {
            $and: [
                { estado: { $ne: "obsoleto" } },
                { industry: options.industry || 'ELEVATORS' },
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

        // Tracking de uso (Búsqueda Vectorial)
        await UsageService.trackVectorSearch(tenantId, correlacion_id);

        await logEvento({
            nivel: 'INFO',
            origen: 'RAG_SERVICE',
            accion: 'PURE_VECTOR_SEARCH_SUCCESS',
            mensaje: `Búsqueda vectorial pura para "${query}"`,
            correlacion_id,
            tenantId,
            materiaId: 'ELEVATORS',
            detalles: { limit, query, results: resultsWithScore.length }
        });

        return resultsWithScore
            .filter(([_, score]) => score >= min_score)
            .map(([doc, score]) => ({
                texto: doc.pageContent,
                source: doc.metadata.origen_doc,
                score,
                tipo: doc.metadata.tipo_componente,
                modelo: doc.metadata.modelo
            }));

    } catch (error) {
        await logEvento({
            nivel: 'ERROR',
            origen: 'RAG_SERVICE',
            accion: 'PURE_SEARCH_ERROR',
            mensaje: `Error en búsqueda vectorial pura: ${(error as Error).message}`,
            correlacion_id,
            tenantId,
            materiaId: 'ELEVATORS',
            stack: (error as Error).stack
        });
        throw new DatabaseError('Error en búsqueda vectorial pura', error as Error);
    } finally {
        const duracionTotal = Date.now() - inicio;

        // SLA Estricto para búsqueda pura: 200ms
        if (duracionTotal > 200) {
            await logEvento({
                nivel: 'WARN',
                origen: 'RAG_SERVICE',
                accion: 'PURE_SLA_VIOLATION',
                mensaje: `Búsqueda vectorial pura excedió SLA: ${duracionTotal}ms`,
                correlacion_id,
                detalles: { duracion_total_ms: duracionTotal }
            });
        }
    }
}

/**
 * Retrieves relevant technical documents for a given pedido ID.
 * Generates an embedding for the pedido's text and performs a vector search.
 */
export async function getRelevantDocuments(
    pedidoId: string,
    tenantId: string,
    options: { topK: number; correlacion_id: string }
): Promise<{ id: string; content: string }[]> {
    GetRelevantDocumentsSchema.parse({ pedidoId, ...options });
    const { topK, correlacion_id } = options;
    try {
        const db = await connectDB();
        const pedido = await db.collection('pedidos').findOne({ _id: new (await import("mongodb")).ObjectId(pedidoId) });

        if (!pedido) {
            throw new AppError('NOT_FOUND', 404, `Pedido ${pedidoId} not found`);
        }

        // 🛡️ Tenant Isolation Check
        if (pedido.tenantId && pedido.tenantId !== tenantId) {
            throw new AppError('FORBIDDEN', 403, `No tienes permiso para acceder a este recurso`);
        }

        const textoPedido = pedido.pdf_texto || "";
        if (!textoPedido) {
            return [];
        }

        // Search using the full pedido text as query
        const results = await performTechnicalSearch(textoPedido, tenantId, correlacion_id, topK);

        return results.map((r, index) => ({
            id: `doc_${index}`,
            content: r.texto
        }));
    } catch (error) {
        throw error instanceof AppError ? error : new DatabaseError('Error retrieving relevant documents', error as Error);
    }
}
