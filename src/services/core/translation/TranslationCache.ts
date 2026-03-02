
import { redis } from '@/lib/redis';

/**
 * 🚀 Translation Cache Service
 * Proposito: Gestión de caché en Redis para mensajes de i18n.
 */
export class TranslationCache {
    private static TTL = 3600 * 24; // 24 horas

    /**
     * Obtiene mensajes cacheados.
     */
    static async getCachedMessages(locale: string, tenantId: string): Promise<Record<string, unknown> | null> {
        const cacheKey = `i18n:${tenantId}:${locale}`;
        try {
            return await redis.get(cacheKey) as Record<string, unknown> | null;
        } catch (e) {
            console.error('[TranslationCache] Redis get error:', e);
            return null;
        }
    }

    /**
     * Guarda mensajes en caché.
     */
    static async setCachedMessages(locale: string, tenantId: string, messages: Record<string, unknown>) {
        const cacheKey = `i18n:${tenantId}:${locale}`;
        try {
            await redis.set(cacheKey, messages, { ex: this.TTL });
        } catch (e) {
            console.error('[TranslationCache] Redis set error:', e);
        }
    }

    /**
     * Invalida la caché para un locale y tenant.
     */
    static async invalidate(locale: string, tenantId: string) {
        try {
            if (tenantId === 'platform_master') {
                const keys = await redis.keys(`i18n:*:${locale}`);
                if (keys.length > 0) await redis.del(...keys);
            } else {
                await redis.del(`i18n:${tenantId}:${locale}`);
            }
        } catch (e) {
            console.error('[TranslationCache] Redis invalidation error:', e);
        }
    }
}
