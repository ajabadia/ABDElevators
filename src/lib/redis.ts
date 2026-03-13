import { Redis } from '@upstash/redis';
import IORedis from 'ioredis';

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const hasLocal = !!process.env.REDIS_URL;

if (!hasUpstash && !hasLocal) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('REDIS_ERROR: No se ha configurado ninguna instancia de Redis (REDIS_URL o UPSTASH_*)');
    } else {
        console.warn('⚠️ [REDIS] URL o Token no configurados. Las funcionalidades de cache estarán desactivadas.');
    }
}

// REST Client (for serverless/edge)
// Phase 120: Added local Redis Socket support via REDIS_URL
let redisClient: RedisClient;

interface RedisClient {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any, options?: { ex?: number }) => Promise<any>;
    del: (...keys: string[]) => Promise<number>;
    exists: (key: string) => Promise<number>;
    keys: (pattern: string) => Promise<string[]>;
    incr: (key: string) => Promise<number>;
    flushall?: () => Promise<string>;
}

const createDummyClient = (): RedisClient => ({
    get: async () => null,
    set: async () => 'OK',
    del: async () => 0,
    exists: async () => 0,
    keys: async () => [],
    incr: async () => 0,
    flushall: async () => 'OK'
});

if (process.env.REDIS_URL) {
    if (process.env.NODE_ENV === 'development') {
        console.log('🚀 [REDIS] Usando instancia LOCAL (Socket/IORedis)');
    }
    const io = new IORedis(process.env.REDIS_URL);
    io.on('error', (err) => {
        if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ [REDIS_MAIN] Connection error:', err.message);
        }
    });
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
        keys: async (pattern: string) => io.keys(pattern),
        incr: async (key: string) => io.incr(key)
    };
} else if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (process.env.NODE_ENV === 'development') {
        console.log('☁️ [REDIS] Usando instancia CLOUD (Upstash/REST)');
    }
    const upstash = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    redisClient = {
        get: async (key: string) => upstash.get(key),
        set: async (key: string, value: any, options?: { ex?: number }) => {
            if (options?.ex) {
                return upstash.set(key, value, { ex: options.ex });
            }
            return upstash.set(key, value);
        },
        del: async (...keys: string[]) => upstash.del(...keys),
        exists: async (key: string) => upstash.exists(key),
        keys: async (pattern: string) => upstash.keys(pattern),
        incr: async (key: string) => upstash.incr(key)
    };
} else {
    // Phase 120: Mock client if no configuration to avoid bootsrap errors (Auditoría 016)
    redisClient = createDummyClient();
}

export const redis: RedisClient = redisClient as any;

// Socket Client Factory (for BullMQ / Worker)
let ioredisInstance: IORedis;

export function getRedisConnection() {
    if (!ioredisInstance) {
        // We ensure password is included for Upstash Socket protocol (Auditoría 015)
        let redisUrl = process.env.REDIS_URL;

        if (!redisUrl && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            const host = process.env.UPSTASH_REDIS_REST_URL.replace('https://', '');
            const token = process.env.UPSTASH_REDIS_REST_TOKEN;
            // Upstash requires rediss:// for the socket protocol on port 6379
            redisUrl = `rediss://:${token}@${host}:6379`;
        }

        if (redisUrl && (process.env.NODE_ENV === 'production' || process.env.REDIS_TLS === 'true')) {
            // 🛡️ [SECURITY] Hardening Wave 4: Force rediss:// in production
            if (redisUrl.startsWith('redis://')) {
                redisUrl = redisUrl.replace('redis://', 'rediss://');
            }
        }

        if (!redisUrl) {
            throw new Error('REDIS_ERROR: REDIS_URL o UPSTASH_REDIS no configurados para el Worker');
        }

        ioredisInstance = new IORedis(redisUrl, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            showFriendlyErrorStack: true
        });

        // Phase 120: Avoid process crash on connection failure (Auditoría 017)
        ioredisInstance.on('error', (err) => {
            // 🛡️ [Wave 4] Sanitize error message and log as error
            const sanitizedMessage = err.message.replace(/redis:\/\/.*@/, 'redis://[REDACTED]@');
            if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ [REDIS_SOCKET] Connection error:', sanitizedMessage);
            }
        });
    }
    return ioredisInstance;
}
