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
    limit = 5
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
            collection: collection as any, // LangChain internals require this cast unfortunately but we keep it minimal
            indexName: "vector_index",
            textKey: "texto_chunk",
            embeddingKey: "embedding",
        });

        // REGLA: Usar MMR para evitar fragmentos redundantes (Estudio de Optimización F5)
        // MMR balancea relevancia con diversidad.
        const results = await vectorStore.maxMarginalRelevanceSearch(query, {
            k: limit,
            fetchK: 20, // Recuperar 20 candidatos para re-rankear por diversidad
            filter: { "estado": { "$ne": "obsoleto" } }
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
 * Búsqueda vectorial PURA optimizada para velocidad.
 * NO usa MMR para garantizar SLA < 200ms.
 * Ideal para navegación técnica rápida por el usuario.
 */
export async function pureVectorSearch(
    query: string,
    tenantId: string,
    correlacion_id: string,
    options: { limit?: number; min_score?: number } = {}
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

        // Búsqueda directa por similitud (más rápida que MMR)
        const resultsWithScore = await vectorStore.similaritySearchWithScore(
            query,
            limit,
            { "estado": { "$ne": "obsoleto" } }
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
