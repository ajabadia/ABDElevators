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
        // We assume generic MONGODB_URI-like naming or specific REDIS_URL
        const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL?.replace('https://', 'rediss://');
        ioredis = new IORedis(redisUrl!, {
            maxRetriesPerRequest: null,
        });
    }
    return ioredis;
}
