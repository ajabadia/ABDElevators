import { TranslationService } from '../services/core/translation-service';
import { SUPPORTED_LOCALES } from '../lib/i18n-config';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

/**
 * 🔄 Manual I18n Sync Script
 * Forces synchronization of all local JSON translation messages to the database.
 */
async function sync() {
    console.log('🚀 Starting I18n Sync...');

    try {
        for (const locale of SUPPORTED_LOCALES) {
            console.log(`\nSyncing locale: [${locale}]...`);
            const result = await TranslationService.forceSyncFromLocal(locale, 'platform_master');
            console.log(`✅ ${locale} Synced: Added ${result.added}, Updated ${result.updated} keys.`);
        }

        console.log('\n✨ Sync completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Sync failed:', error);
        process.exit(1);
    }
}

sync();
