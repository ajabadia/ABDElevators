import { redis } from './redis';
import { RagResult } from './rag-service';
import crypto from 'crypto';
import { logEvento } from './logger';
import { LRUCache } from 'lru-cache';
import { trace, Span } from '@opentelemetry/api';

const tracer = trace.getTracer('abd-rag-platform');

/**
 * SemanticCache: Gestión de caché para resultados de búsqueda RAG.
 * Fase 71: Escalabilidad & Resiliencia Operativa.
 * Implementa una jerarquía L1 (Memoria local) y L2 (Redis).
 */
export class SemanticCache {
    private static PREFIX = 'abd-rag:sc:';
    private static DEFAULT_TTL = 60 * 60 * 24; // 24 horas para L2 (Redis)
    private static L1_TTL = 1000 * 60 * 5;     // 5 minutos para L1 (Memoria)

    // Almacenamiento L1: Memoria local del servidor/borde
    private static l1 = new LRUCache<string, RagResult[]>({
        max: 500, // Máximo 500 entradas calientes
        ttl: SemanticCache.L1_TTL,
        updateAgeOnGet: true
    });

    /**
     * Genera un key determinista basado en el contenido de la consulta.
     */
    private static getCacheKey(query: string, tenantId: string, environment: string): string {
        const normalized = query.trim().toLowerCase()
            .replace(/[^\w\s]/gi, '') // Eliminar puntuación básica para normalizar
            .replace(/\s+/g, ' ');   // Colapsar espacios

        const hash = crypto.createHash('sha256').update(normalized).digest('hex');
        return `${this.PREFIX}${tenantId}:${environment}:${hash.substring(0, 16)}`;
    }

    /**
     * Recupera resultados de la caché usando jerarquía L1 -> L2 y Búsqueda Semántica (Phase 171.1).
     */
    static async get(query: string, tenantId: string, environment: string, correlationId: string): Promise<RagResult[] | null> {
        try {
            const key = this.getCacheKey(query, tenantId, environment);

            // 1. Intentar L1 (Exact match rápido)
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

            // 2. Búsqueda Vectorial Semántica en Caché (Phase 171.1)
            // Si no hay exact match, buscamos queries similares que ya tengan resultados.
            const similarResults = await this.findSimilarInCache(query, tenantId, environment, correlationId);
            if (similarResults) {
                // Promocionar a L1 para futuras peticiones rápidas
                this.l1.set(key, similarResults); // Cache the semantically found result under the exact key
                return similarResults;
            }

            // 3. Fallback a L2 (Redis) - Solo si lo anterior falla
            const cached = await redis.get(key) as RagResult[] | null;
            if (cached) {
                // Promocionar a L1 para futuras peticiones rápidas
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

    /**
     * Busca en la base de datos de caché (MongoDB) queries semánticamente similares.
     */
    private static async findSimilarInCache(
        query: string,
        tenantId: string,
        environment: string,
        correlationId: string
    ): Promise<RagResult[] | null> {
        return tracer.startActiveSpan('semantic_cache.similarity_lookup', async (span: Span) => {
            try {
                const { generateEmbedding } = await import('./llm');
                const embedding = await generateEmbedding(query, tenantId, correlationId);

                const { connectDB } = await import('./db');
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

                if (matches.length > 0 && matches[0].score > 0.96) { // Umbral de confianza muy alto para caché
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

    /**
     * Persiste resultados en ambos niveles de caché.
     */
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

            // Guardar en L1
            this.l1.set(key, results);

            // Guardar en L2 (Redis)
            await redis.set(key, results, { ex: ttlL2 });

            // 3. Persistencia en MongoDB para Búsqueda Semántica (Phase 171.1)
            const { generateEmbedding } = await import('./llm');
            const { connectDB } = await import('./db');
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

    /**
     * Limpia la caché local (L1). Útil en deploys o cambios masivos.
     */
    static clearL1(): void {
        this.l1.clear();
    }
}
