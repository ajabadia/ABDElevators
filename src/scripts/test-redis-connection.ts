import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { Redis } from '@upstash/redis';
import IORedis from 'ioredis';

async function testConnection() {
    console.log('🧪 Testing Redis Connections...');

    // 1. Test Local
    if (process.env.REDIS_URL) {
        console.log('\n--- Checking LOCAL Redis ---');
        try {
            const io = new IORedis(process.env.REDIS_URL);
            await io.set('test:local', 'ok', 'EX', 10);
            const res = await io.get('test:local');
            console.log('✅ Local Redis:', res === 'ok' ? 'WORKING' : 'FAILED');
            io.disconnect();
        } catch (e: any) {
            console.error('❌ Local Redis FAILED:', e.message);
        }
    }

    // 2. Test Upstash
    if (process.env.UPSTASH_REDIS_REST_URL) {
        console.log('\n--- Checking UPSTASH (Cloud) Redis ---');
        try {
            const upstash = new Redis({
                url: process.env.UPSTASH_REDIS_REST_URL,
                token: process.env.UPSTASH_REDIS_REST_TOKEN!,
            });
            await upstash.set('test:cloud', 'ok', { ex: 10 });
            const res = await upstash.get('test:cloud');
            console.log('✅ Upstash Cloud:', res === 'ok' ? 'WORKING' : 'FAILED');
        } catch (e: any) {
            console.error('❌ Upstash Cloud FAILED:', e.message);
            if (e.message.includes('403') || e.message.includes('quota')) {
                console.error('🚨 Still quota or auth issues with Upstash');
            }
        }
    }

    process.exit(0);
}

testConnection();
