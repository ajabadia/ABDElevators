import { TranslationService } from '../src/services/core/translation-service';
import { connectDB } from '../src/lib/db';

async function sync() {
    try {
        console.log('Connecting to DB...');
        await connectDB();

        console.log('Starting force sync for all locales...');
        // TranslacionService.forceSyncAllLocales calls forceSyncFromLocal internally
        const results = await TranslationService.forceSyncAllLocales();
        console.log('Sync results:', JSON.stringify(results, null, 2));

        console.log('Sync completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Sync failed:', error);
        process.exit(1);
    }
}

sync();
