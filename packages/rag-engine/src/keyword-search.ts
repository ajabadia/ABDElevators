
import { connectDB, logEvento } from "@abd/platform-core/server";
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { RagResult } from "./types";

const tracer = trace.getTracer('abd-rag-platform');

export class KeywordSearchService {
    /**
     * Búsqueda por palabras clave (BM25) usando Atlas Search (Lucene).
     */
    static async pureKeywordSearch(
        query: string,
        tenantId: string,
        correlationId: string,
        limit = 5,
        industry: string = 'GENERIC',
        environment: string = 'PRODUCTION',
        spaceId?: string
    ): Promise<RagResult[]> {
        return tracer.startActiveSpan('rag.keyword_search', {
            attributes: {
                'tenant.id': tenantId,
                'correlation.id': correlationId,
                'rag.query': query,
                'rag.strategy': 'BM25',
                'rag.environment': environment,
                'rag.space_id': spaceId
            }
        }, async (span) => {
            const inicio = Date.now();
            try {
                const db = await connectDB();
                const collection = db.collection('document_chunks');

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
                            ],
                            ...(spaceId ? { spaceId } : {})
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

                const finalResults: RagResult[] = results.map((r: any) => ({
                    text: r.chunkText,
                    source: r.sourceDoc,
                    score: r.score,
                    type: r.componentType,
                    model: r.model,
                    cloudinaryUrl: r.cloudinaryUrl,
                    language: r.language,
                    chunkType: r.chunkType,
                    approxPage: r.approxPage
                }));

                const duration = Date.now() - inicio;
                span.setAttribute('rag.result_count', finalResults.length);
                span.setAttribute('rag.duration_ms', duration);

                await logEvento({
                    level: 'INFO',
                    source: 'KEYWORD_SEARCH_SERVICE',
                    action: 'KEYWORD_SEARCH_SUCCESS',
                    message: `Búsqueda BM25 para "${query}"`,
                    correlationId,
                    tenantId,
                    details: { hits: finalResults.length, durationMs: duration }
                });

                return finalResults;

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
