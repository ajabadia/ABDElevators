
import IORedis from 'ioredis';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

function getRedisConnection() {
    let redisUrl = process.env.REDIS_URL;
    if (!redisUrl && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const host = process.env.UPSTASH_REDIS_REST_URL.replace('https://', '');
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;
        redisUrl = `rediss://:${token}@${host}:6379`;
    }
    return new IORedis(redisUrl!, { maxRetriesPerRequest: null });
}

async function listKeys() {
    const redis = getRedisConnection();
    try {
        const keys = await redis.keys('*');
        console.log('--- ALL REDIS KEYS ---');
        console.log(keys.length === 0 ? 'No keys found' : keys.join('\n'));
    } catch (e) {
        console.error(e);
    } finally {
        await redis.quit();
        process.exit();
    }
}

listKeys();
