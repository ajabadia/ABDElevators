
import { redis } from '@/lib/redis';
import { RagResult } from './types';
import crypto from 'crypto';
import { logEvento, connectDB } from '@abd/platform-core/server';
import { LRUCache } from 'lru-cache';
import { trace, Span } from '@opentelemetry/api';

const tracer = trace.getTracer('abd-rag-platform');

/**
 * SemanticCache: Gestión de caché para resultados de búsqueda RAG.
 */
export class SemanticCache {
    private static PREFIX = 'abd-rag:sc:';
    private static DEFAULT_TTL = 60 * 60 * 24;
    private static L1_TTL = 1000 * 60 * 5;

    private static l1 = new LRUCache<string, RagResult[]>({
        max: 500,
        ttl: SemanticCache.L1_TTL,
        updateAgeOnGet: true
    });

    private static getCacheKey(query: string, tenantId: string, environment: string): string {
        const normalized = query.trim().toLowerCase()
            .replace(/[^\w\s]/gi, '')
            .replace(/\s+/g, ' ');

        const hash = crypto.createHash('sha256').update(normalized).digest('hex');
        return `${this.PREFIX}${tenantId}:${environment}:${hash.substring(0, 16)}`;
    }

    static async get(query: string, tenantId: string, environment: string, correlationId: string): Promise<RagResult[] | null> {
        try {
            const key = this.getCacheKey(query, tenantId, environment);

            const inMemory = this.l1.get(key);
            if (inMemory) {
                await logEvento({
                    level: 'DEBUG',
                    source: 'SEMANTIC_CACHE',
                    action: 'L1_HIT',
                    message: `L1 Hit (Memoria) para query: "${query.substring(0, 30)}..."`,
                    correlationId,
                    tenantId,
                    details: { key, strategy: 'L1' }
                });
                return inMemory;
            }

            const similarResults = await this.findSimilarInCache(query, tenantId, environment, correlationId);
            if (similarResults) {
                this.l1.set(key, similarResults);
                return similarResults;
            }

            const cached = await redis.get(key) as RagResult[] | null;
            if (cached) {
                this.l1.set(key, cached);

                await logEvento({
                    level: 'INFO',
                    source: 'SEMANTIC_CACHE',
                    action: 'L2_HIT',
                    message: `L2 Hit (Redis) para query: "${query.substring(0, 30)}..."`,
                    correlationId,
                    tenantId,
                    details: { key, strategy: 'L2' }
                });
                return cached;
            }

            return null;
        } catch (error) {
            console.warn("[CACHE GET ERROR]", error);
            return null;
        }
    }

    private static async findSimilarInCache(
        query: string,
        tenantId: string,
        environment: string,
        correlationId: string
    ): Promise<RagResult[] | null> {
        return tracer.startActiveSpan('semantic_cache.similarity_lookup', async (span: Span) => {
            try {
                const { generateEmbedding } = await import('@/lib/llm');
                const embedding = await generateEmbedding(query, tenantId, correlationId);

                const db = await connectDB();
                const collection = db.collection('semantic_cache');

                const matches = await collection.aggregate([
                    {
                        $vectorSearch: {
                            index: "vector_index",
                            path: "embedding",
                            queryVector: embedding,
                            numCandidates: 10,
                            limit: 1,
                            filter: { tenantId, environment }
                        }
                    },
                    {
                        $project: {
                            results: 1,
                            score: { $meta: "vectorSearchScore" }
                        }
                    }
                ]).toArray();

                if (matches.length > 0 && matches[0].score > 0.96) {
                    await logEvento({
                        level: 'INFO',
                        source: 'SEMANTIC_CACHE',
                        action: 'SEMANTIC_HIT',
                        message: `Semantic Hit (Score: ${matches[0].score.toFixed(4)}) para original: "${query.substring(0, 30)}..."`,
                        correlationId,
                        tenantId
                    });
                    return matches[0].results;
                }
                return null;
            } catch (err) {
                console.warn("[SEMANTIC_CACHE_SIMILARITY_ERROR]", err);
                return null;
            } finally {
                span.end();
            }
        });
    }

    static async set(
        query: string,
        results: RagResult[],
        tenantId: string,
        environment: string,
        correlationId: string,
        ttlL2 = this.DEFAULT_TTL
    ): Promise<void> {
        try {
            if (!results || results.length === 0) return;

            const key = this.getCacheKey(query, tenantId, environment);

            this.l1.set(key, results);

            await redis.set(key, results, { ex: ttlL2 });

            const { generateEmbedding } = await import('@/lib/llm');
            const [embedding, db] = await Promise.all([
                generateEmbedding(query, tenantId, correlationId),
                connectDB()
            ]);

            await db.collection('semantic_cache').updateOne(
                { key },
                {
                    $set: {
                        key,
                        query,
                        embedding,
                        results,
                        tenantId,
                        environment,
                        createdAt: new Date()
                    }
                },
                { upsert: true }
            );

            await logEvento({
                level: 'DEBUG',
                source: 'SEMANTIC_CACHE',
                action: 'CACHE_SET_ALL',
                message: `Resultados cacheados L1/L2/DB para: "${query.substring(0, 30)}..."`,
                correlationId,
                tenantId,
                details: { key, ttL2: ttlL2, resultCount: results.length }
            });
        } catch (error) {
            console.warn("[CACHE SET ERROR]", error);
        }
    }

    static clearL1(): void {
        this.l1.clear();
    }
}
