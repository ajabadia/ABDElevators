import { connectDB } from "./db";
import { generateEmbedding } from "./llm";
import { logEvento } from "./logger";
import { DocumentChunkSchema } from "./schemas";
import { ObjectId } from "mongodb";

export interface RagResult {
    texto: string;
    source: string;
    score: number;
    tipo: string;
    modelo: string;
}

/**
 * Servicio RAG para búsqueda semántica en el corpus técnico.
 */
export async function performTechnicalSearch(
    query: string,
    correlacion_id: string,
    limit = 5
): Promise<RagResult[]> {
    const start = Date.now();
    const embedding = await generateEmbedding(query, correlacion_id);

    try {
        const db = await connectDB();
        const collection = db.collection('document_chunks');

        // Búsqueda Vectorial en MongoDB Atlas
        // Nota: El índice 'vector_index' debe estar configurado en Atlas
        const pipeline = [
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": embedding,
                    "numCandidates": 100,
                    "limit": limit,
                    "filter": { "estado": { "$ne": "obsoleto" } } // Solo manuales vigentes
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
        const duration = Date.now() - start;

        await logEvento({
            nivel: 'INFO',
            origen: 'RAG_SERVICE',
            accion: 'SEARCH',
            mensaje: `RAG search for "${query}" completed in ${duration}ms`,
            correlacion_id,
            detalles: { results_count: results.length, duration_ms: duration }
        });

        return results.map(r => ({
            texto: r.texto,
            source: r.source,
            score: r.score,
            tipo: r.tipo,
            modelo: r.modelo
        }));

    } catch (error) {
        console.error('Vector Search Error:', error);
        // Fallback: Si el índice no existe o falla, logueamos y devolvemos vacío
        // En producción esto debería lanzar un DatabaseError
        return [];
    }
}
