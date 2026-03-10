import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { TranslationService } from '../src/services/core/translation-service';
import { connectDB } from '../src/lib/db';
import { SUPPORTED_LOCALES } from '../src/lib/i18n-config';

async function sync() {
    console.log('🚀 Starting Translation Sync...');
    await connectDB();

    for (const locale of SUPPORTED_LOCALES) {
        console.log(`\n📄 Processing locale: ${locale}`);
        const result = await TranslationService.forceSyncFromLocal(locale, 'platform_master');
        console.log(`✅ ${locale} sync complete:`, {
            added: result.added,
            updated: result.updated,
            totalKeys: Object.keys(result.messages).length
        });
    }

    console.log('\n✨ All locales synchronized successfully.');
    process.exit(0);
}

sync().catch(err => {
    console.error('❌ Sync failed:', err);
    process.exit(1);
});
