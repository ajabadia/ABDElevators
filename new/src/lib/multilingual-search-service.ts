import { connectDB } from "@/lib/db";
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { logEvento } from "@/lib/logger";
import { UsageService } from "@/lib/usage-service";
import { RagResult } from "./rag-service";

const tracer = trace.getTracer('abd-rag-platform');

export class MultilingualSearchService {
    /**
     * Búsqueda Multilingüe Avanzada (Phase 21.1).
     */
    static async performMultilingualSearch(
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

                const duration = Date.now() - inicio;
                span.setAttribute('rag.result_count', results.length);
                span.setAttribute('rag.duration_ms', duration);

                await UsageService.trackVectorSearch(tenantId, correlationId);
                if (results.length > 0) {
                    const avgScore = results.reduce((acc, curr) => acc + (curr.score || 0), 0) / results.length;
                    await UsageService.trackContextPrecision(tenantId, correlationId, avgScore, query);
                }

                await logEvento({
                    level: 'DEBUG',
                    source: 'MULTILINGUAL_SEARCH_SERVICE',
                    action: 'SEARCH_SUCCESS',
                    message: `Búsqueda multilingüe para "${query}"`,
                    correlationId,
                    tenantId,
                    details: { hits: results.length, durationMs: duration }
                });

                return results.map((doc: any) => ({
                    text: doc.chunkText,
                    source: doc.sourceDoc,
                    score: doc.score,
                    type: doc.componentType,
                    model: doc.model,
                    cloudinaryUrl: doc.cloudinaryUrl,
                    chunkType: doc.chunkType,
                    approxPage: doc.approxPage
                }));

            } catch (error: any) {
                span.recordException(error);
                span.setStatus({ code: SpanStatusCode.ERROR });
                return [];
            } finally {
                span.end();
            }
        });
    }
}
