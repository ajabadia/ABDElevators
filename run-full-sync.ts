import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { TranslationService } from './src/lib/translation-service';

async function fullSync() {
    console.log('🚀 Iniciando sincronización full...');
    try {
        console.log('--- SYNC EN ---');
        const enResult = await TranslationService.syncBidirectional('en', 'to-db');
        console.log(`✅ EN: ${enResult.added} nuevas llaves.`);

        console.log('--- SYNC ES ---');
        const esResult = await TranslationService.syncBidirectional('es', 'to-db');
        console.log(`✅ ES: ${esResult.added} nuevas llaves.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fullSync();
