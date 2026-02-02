import { redis } from './redis';
import { RagResult } from './rag-service';
import crypto from 'crypto';
import { logEvento } from './logger';

/**
 * SemanticCache: Gestión de caché para resultados de búsqueda RAG.
 * Fase 33: RAG Cognitive Scaling.
 */
export class SemanticCache {
    private static PREFIX = 'abd-rag:sc:';
    private static DEFAULT_TTL = 60 * 60 * 24; // 24 horas

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
     * Recupera resultados de la caché si existen.
     */
    static async get(query: string, tenantId: string, environment: string, correlationId: string): Promise<RagResult[] | null> {
        try {
            const key = this.getCacheKey(query, tenantId, environment);
            const cached = await redis.get<RagResult[]>(key);

            if (cached) {
                await logEvento({
                    level: 'INFO',
                    source: 'SEMANTIC_CACHE',
                    action: 'CACHE_HIT',
                    message: `Cache hit para query: "${query.substring(0, 30)}..."`,
                    correlationId,
                    tenantId,
                    details: { query, key }
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
     * Persiste resultados en la caché.
     */
    static async set(
        query: string,
        results: RagResult[],
        tenantId: string,
        environment: string,
        correlationId: string,
        ttl = this.DEFAULT_TTL
    ): Promise<void> {
        try {
            // No cachear resultados vacíos
            if (!results || results.length === 0) return;

            const key = this.getCacheKey(query, tenantId, environment);
            await redis.set(key, results, { ex: ttl });

            await logEvento({
                level: 'DEBUG',
                source: 'SEMANTIC_CACHE',
                action: 'CACHE_SET',
                message: `Resultados cacheados para query: "${query.substring(0, 30)}..."`,
                correlationId,
                tenantId,
                details: { query, key, ttl, resultCount: results.length }
            });
        } catch (error) {
            console.warn("[CACHE SET ERROR]", error);
        }
    }
}
