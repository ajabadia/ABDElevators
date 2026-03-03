
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// 1. Load Environment Variables
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
loadEnv(envLocalPath);

async function main() {
    const locale = process.argv[2] || 'es';
    console.log(`🚀 Starting manual i18n sync for locale: ${locale}...`);

    try {
        const { TranslationService } = await import('../src/lib/translation-service');
        const { redis } = await import('../src/lib/redis');

        if (!process.env.UPSTASH_REDIS_REST_URL) {
            console.error('❌ UPSTASH_REDIS_REST_URL is missing!');
            process.exit(1);
        }

        // Sync given locale
        console.log(`🇪🇸 Syncing ${locale} to DB...`);
        const messages = await TranslationService.forceSyncFromLocal(locale, 'platform_master');
        console.log(`✅ DB Sync complete for ${locale}.`);

        // Manually invalidate known cache keys instead of scanning if keys() is flaky
        const cacheKeys = [
            `i18n:platform_master:${locale}`,
            `i18n:abd_global:${locale}`
        ];

        console.log('🧹 Clearing specific Redis cache keys...');
        for (const key of cacheKeys) {
            await redis.del(key);
            console.log(`✨ Deleted ${key}`);
        }

        console.log('🎉 All done.');

    } catch (error) {
        console.error('❌ Error during sync:', error);
        process.exit(1);
    } finally {
        setTimeout(() => process.exit(0), 500);
    }
}

main();
