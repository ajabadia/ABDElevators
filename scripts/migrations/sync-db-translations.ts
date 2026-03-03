import { TranslationService } from '../lib/translation-service';
import { connectDB } from '../lib/db';
import { logEvento } from '../lib/logger';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    const correlationId = 'SYNC_DB_I18N_' + Date.now();
    console.log(`🚀 Starting terminology sync to DB (Correlation: ${correlationId})`);

    try {
        await connectDB();

        const locales = ['es', 'en'];

        for (const locale of locales) {
            console.log(`📦 Syncing [${locale}]...`);
            const messages = await TranslationService.forceSyncFromLocal(locale, 'platform_master');
            console.log(`✅ [${locale}] synced with ${Object.keys(messages).length} root keys.`);
        }

        await logEvento({
            level: 'INFO',
            source: 'I18N_SYNC_SCRIPT',
            action: 'SYNC_COMPLETE',
            message: 'Terminology sync from JSON to DB completed for all locales.',
            correlationId
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    }
}

main();
