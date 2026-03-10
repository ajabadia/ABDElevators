
import { TranslationService } from '../src/services/core/translation-service';
import { SUPPORTED_LOCALES } from '../src/lib/i18n-config';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function cleanupAndSync() {
    console.log('🚀 Starting i18n Cleanup & Sync...');

    const keysToRemove = [
        'navigation.nav.settings.security_advanced',
        'navigation.nav.help.labs'
    ];

    try {
        for (const locale of SUPPORTED_LOCALES) {
            console.log(`\nProcessing locale: [${locale}]`);

            for (const key of keysToRemove) {
                console.log(`  🗑️ Removing legacy key: ${key}`);
                await TranslationService.deleteTranslation(key, locale, 'platform_master');
            }

            console.log(`  🔄 Syncing from local...`);
            const result = await TranslationService.forceSyncFromLocal(locale, 'platform_master');
            console.log(`  ✅ Done: Added ${result.added}, Updated ${result.updated} keys.`);
        }

        console.log('\n✨ Cleanup and Sync completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Operation failed:', error);
        process.exit(1);
    }
}

cleanupAndSync();
