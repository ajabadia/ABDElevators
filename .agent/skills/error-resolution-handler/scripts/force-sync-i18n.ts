import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// 1. Load Environment Variables MANUALLY (Foolproof method)
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');

function loadEnv(filePath: string) {
    if (fs.existsSync(filePath)) {
        console.log(`Loading env from ${filePath}`);
        const envConfig = dotenv.parse(fs.readFileSync(filePath));
        for (const k in envConfig) {
            process.env[k] = envConfig[k];
        }
    } else {
        console.log(`Skipping ${filePath} (not found)`);
    }
}

loadEnv(envPath);
loadEnv(envLocalPath); // Last one wins (override)

// Check critical vars (without revealing values)
const hasRedisUrl = !!process.env.UPSTASH_REDIS_REST_URL;
const hasRedisToken = !!process.env.UPSTASH_REDIS_REST_TOKEN;
const hasDbUrl = !!process.env.MONGODB_URI;

console.log('Environment Check:', {
    UPSTASH_REDIS_REST_URL: hasRedisUrl ? 'SET' : 'MISSING',
    UPSTASH_REDIS_REST_TOKEN: hasRedisToken ? 'SET' : 'MISSING',
    MONGODB_URI: hasDbUrl ? 'SET' : 'MISSING'
});

if (!hasRedisUrl || !hasRedisToken || !hasDbUrl) {
    console.error('❌ Missing critical environment variables. Aborting.');
    // Check if they are maybe under different names?
    console.log('Available Env Keys:', Object.keys(process.env).filter(k => k.includes('REDIS') || k.includes('MONGO')));
    process.exit(1);
}

// 2. Dynamic Import of Services (After env is loaded)
async function main() {
    console.log('🚀 Starting manual i18n sync...');

    try {
        const { TranslationService } = await import('../../../../src/lib/translation-service');
        const { redis } = await import('../../../../src/lib/redis');

        // Sync 'es' locale
        console.log('🇪🇸 Syncing ES...');
        await TranslationService.forceSyncFromLocal('es', 'platform_master');

        // Sync 'en' locale (just in case)
        console.log('🇺🇸 Syncing EN...');
        await TranslationService.forceSyncFromLocal('en', 'platform_master');

        console.log('✅ Sync complete. Redis cache should be invalidated.');

        // Explicitly check if the key exists in Redis now
        const esKey = 'i18n:platform_master:es';
        const exists = await redis.exists(esKey);
        if (exists) {
            console.log(`⚠️ Key ${esKey} still exists in Redis. Deleting manually.`);
            await redis.del(esKey);
        } else {
            console.log(`✨ Key ${esKey} is clear.`);
        }

    } catch (error) {
        console.error('❌ Error during sync:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

main();
