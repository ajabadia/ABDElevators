import { redis } from './src/lib/redis';
import { SUPPORTED_LOCALES } from './src/lib/i18n-config';

async function clearCache() {
    console.log('🧹 Clearing i18n Redis cache...');
    for (const locale of SUPPORTED_LOCALES) {
        const pattern = `i18n:*:${locale}`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            console.log(`🗑️ Deleting ${keys.length} keys for locale ${locale}...`);
            await redis.del(...keys);
        }
    }
    console.log('✅ Cache cleared.');
    process.exit(0);
}

clearCache().catch(err => {
    console.error('❌ Error clearing cache:', err);
    process.exit(1);
});
