
import dotenv from 'dotenv';
import path from 'path';

/**
 * 🛠️ Maintenance Script: Clear i18n Cache (REPAIRED)
 * 
 * Usage: npx tsx scripts/maintenance/clear-i18n-cache.ts
 */
async function main() {
    // 1. Load environment variables FIRST
    const envPath = path.resolve(process.cwd(), '.env.local');
    dotenv.config({ path: envPath });
    
    console.log(`🧹 [MAINTENANCE] Environment loaded from ${envPath}`);
    console.log('🧹 [MAINTENANCE] Starting i18n cache clear...');
    
    // 2. Import services AFTER env is loaded
    try {
        const { TranslationCache } = await import('../../src/services/core/translation/TranslationCache');
        const removed = await TranslationCache.clearAllI18n();
        
        if (removed > 0) {
            console.log(`✅ [MAINTENANCE] Success! Removed ${removed} i18n cache keys.`);
        } else {
            console.log('ℹ️ [MAINTENANCE] No i18n keys found in cache (or already clear).');
        }
    } catch (error) {
        console.error('❌ [MAINTENANCE] Failed to clear i18n cache:', error);
        process.exit(1);
    } finally {
        // Force process exit to close any open connections
        setTimeout(() => process.exit(0), 1000);
    }
}

main();
