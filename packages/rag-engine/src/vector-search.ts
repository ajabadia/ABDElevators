
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { connectDB, logEvento } from "@abd/platform-core/server";
import { DatabaseError } from "@abd/platform-core";
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { UsageService } from "@/lib/usage-service";
import { RagResult } from "./types";
import { z } from "zod";

const tracer = trace.getTracer('abd-rag-platform');

const PureVectorSearchSchema = z.object({
    query: z.string().min(1),
    correlationId: z.string().uuid(),
    limit: z.number().int().positive().optional(),
    minScore: z.number().min(0).max(1).optional()
});

export class VectorSearchService {
    /**
     * Búsqueda vectorial PURA optimizada para velocidad.
     */
    static async pureVectorSearch(
        query: string,
        tenantId: string,
        correlationId: string,
        options: { limit?: number; minScore?: number; industry?: string; environment?: string } = { industry: 'GENERIC' }
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
                        cloudinaryUrl: (doc.metadata as any).cloudinaryUrl,
                        chunkType: doc.metadata.chunkType,
                        approxPage: doc.metadata.approxPage
                    }));

                const duracionTotal = Date.now() - inicio;
                span.setAttribute('rag.duration_ms', duracionTotal);

                await UsageService.trackVectorSearch(tenantId, correlationId);
                if (finalResults.length > 0) {
                    const avgScore = finalResults.reduce((acc, curr) => acc + curr.score, 0) / finalResults.length;
                    await UsageService.trackContextPrecision(tenantId, correlationId, avgScore, query);
                }

                await logEvento({
                    level: 'INFO',
                    source: 'VECTOR_SEARCH_SERVICE',
                    action: 'PURE_VECTOR_SEARCH_SUCCESS',
                    message: `Búsqueda vectorial pura para "${query}"`,
                    correlationId,
                    tenantId,
                    details: { limit, query, durationMs: duracionTotal }
                });

                span.setStatus({ code: SpanStatusCode.OK });
                return finalResults;

            } catch (error: any) {
                span.recordException(error as Error);
                span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
                throw new DatabaseError('Error en búsqueda vectorial pura', error as Error);
            } finally {
                span.end();
            }
        });
    }
}
