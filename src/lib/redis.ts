import { Redis } from '@upstash/redis';
import IORedis from 'ioredis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('REDIS_ERROR: UPSTASH_REDIS_REST_URL o UPSTASH_REDIS_REST_TOKEN no configurados');
    } else {
        console.warn('⚠️ [REDIS] URL o Token no configurados. Las funcionalidades de cache estarán desactivadas.');
    }
}

// REST Client (for serverless/edge)
// Phase 120: Added local Redis Socket support via REDIS_URL
let redisClient: any;

if (process.env.REDIS_URL) {
    if (process.env.NODE_ENV === 'development') {
        console.log('🚀 [REDIS] Usando instancia LOCAL (Socket/IORedis)');
    }
    const io = new IORedis(process.env.REDIS_URL);
    // Wrapper for compatibility with @upstash/redis API
    redisClient = {
        get: async (key: string) => {
            const val = await io.get(key);
            if (!val) return null;
            try { return JSON.parse(val); } catch { return val; }
        },
        set: async (key: string, value: any, options?: { ex?: number }) => {
            const strValue = typeof value === 'string' ? value : JSON.stringify(value);
            if (options?.ex) {
                return io.set(key, strValue, 'EX', options.ex);
            }
            return io.set(key, strValue);
        },
        del: async (...keys: string[]) => io.del(...keys),
        exists: async (key: string) => io.exists(key),
        keys: async (pattern: string) => io.keys(pattern)
    };
} else {
    if (process.env.NODE_ENV === 'development') {
        console.log('☁️ [REDIS] Usando instancia CLOUD (Upstash/REST)');
    }
    redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
}

export const redis = redisClient;

// Socket Client Factory (for BullMQ / Worker)
let ioredisInstance: IORedis;

export function getRedisConnection() {
    if (!ioredisInstance) {
        // We ensure password is included for Upstash Socket protocol (Auditoría 015)
        let redisUrl = process.env.REDIS_URL;

        if (!redisUrl && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            const host = process.env.UPSTASH_REDIS_REST_URL.replace('https://', '');
            const token = process.env.UPSTASH_REDIS_REST_TOKEN;
            // Format: rediss://:PASSWORD@HOST:PORT
            redisUrl = `rediss://:${token}@${host}:6379`;
        }

        if (!redisUrl) {
            throw new Error('REDIS_ERROR: REDIS_URL o UPSTASH_REDIS no configurados para el Worker');
        }

        ioredisInstance = new IORedis(redisUrl, {
            maxRetriesPerRequest: null,
        });
    }
    return ioredisInstance;
}
