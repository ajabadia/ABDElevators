import { Redis } from '@upstash/redis';
import IORedis from 'ioredis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('REDIS_ERROR: UPSTASH_REDIS_REST_URL o UPSTASH_REDIS_REST_TOKEN no configurados');
}

// REST Client (for serverless/edge)
export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Socket Client Factory (for BullMQ / Worker)
let ioredis: IORedis;

export function getRedisConnection() {
    if (!ioredis) {
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

        ioredis = new IORedis(redisUrl, {
            maxRetriesPerRequest: null,
        });
    }
    return ioredis;
}
