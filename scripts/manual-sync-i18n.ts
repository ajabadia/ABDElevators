
import { TranslationService } from '@/services/core/translation-service';
import { connectDB } from '@/lib/db';
import { SUPPORTED_LOCALES } from '@/lib/i18n-config';

async function runSync() {
    console.log('🔗 Connecting to DB...');
    await connectDB();

    console.log('🔄 Starting full i18n sync to DB (platform_master)...');

    for (const locale of SUPPORTED_LOCALES) {
        console.log(`\nProcessing locale: ${locale}`);
        const result = await TranslationService.forceSyncFromLocal(locale, 'platform_master');
        console.log(`✅ ${locale} sync complete: Added: ${result.added}, Updated: ${result.updated}`);
    }

    console.log('\n✨ All locales synchronized successfully.');
    process.exit(0);
}

runSync().catch(err => {
    console.error('❌ Sync failed:', err);
    process.exit(1);
});
