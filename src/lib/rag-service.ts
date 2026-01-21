import { connectDB } from "./db";
import { generateEmbedding } from "./llm";
import { logEvento } from "./logger";
import { DatabaseError, AppError } from "./errors";

export interface RagResult {
    texto: string;
    source: string;
    score: number;
    tipo: string;
    modelo: string;
}

/**
 * Servicio RAG para búsqueda semántica en el corpus técnico.
 * SLA: P95 < 500ms (excluyendo generación de embedding)
 */
export async function performTechnicalSearch(
    query: string,
    correlacion_id: string,
    limit = 5
): Promise<RagResult[]> {
    const inicio = Date.now();

    // El embedding ya mide su propio performance en lib/llm.ts
    const embedding = await generateEmbedding(query, correlacion_id);
    const inicioSearch = Date.now();

    try {
        const db = await connectDB();
        const collection = db.collection('document_chunks');

        const pipeline = [
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": embedding,
                    "numCandidates": 100,
                    "limit": limit,
                    "filter": { "estado": { "$ne": "obsoleto" } }
                }
            },
            {
                "$project": {
                    "texto": "$texto_chunk",
                    "source": "$origen_doc",
                    "tipo": "$tipo_componente",
                    "modelo": "$modelo",
                    "score": { "$meta": "vectorSearchScore" }
                }
            }
        ];

        const results = await collection.aggregate(pipeline).toArray() as any[];

        await logEvento({
            nivel: 'DEBUG',
            origen: 'RAG_SERVICE',
            accion: 'SEARCH_SUCCESS',
            mensaje: `Búsqueda RAG para "${query}" devolvió ${results.length} resultados`,
            correlacion_id,
            detalles: { limit, query }
        });

        return results.map(r => ({
            texto: r.texto,
            source: r.source,
            score: r.score,
            tipo: r.tipo,
            modelo: r.modelo
        }));

    } catch (error: any) {
        await logEvento({
            nivel: 'ERROR',
            origen: 'RAG_SERVICE',
            accion: 'SEARCH_ERROR',
            mensaje: `Error en búsqueda vectorial: ${error.message}`,
            correlacion_id,
            stack: error.stack
        });

        // Regla #7: Fallar explícitamente si es un error de infraestructura
        throw new DatabaseError('Error en motor de búsqueda vectorial Atlas', error);
    } finally {
        const duracionSearch = Date.now() - inicioSearch;
        const duracionTotal = Date.now() - inicio;

        // SLA: La búsqueda base de Atlas debe ser < 500ms
        if (duracionSearch > 500) {
            await logEvento({
                nivel: 'WARN',
                origen: 'RAG_SERVICE',
                accion: 'SLA_VIOLATION',
                mensaje: `Búsqueda Atlas Vector Search lenta: ${duracionSearch}ms`,
                correlacion_id,
                detalles: { duracion_search_ms: duracionSearch, duracion_total_ms: duracionTotal }
            });
        }
    }
}
