import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { TranslationService } from './src/lib/translation-service';
import { connectDB } from './src/lib/db';
import fs from 'fs';

async function sync() {
    console.log('🚀 Iniciando sincronización manual para EN...');
    try {
        await connectDB();

        const locale = 'en';
        const filePath = path.join(process.cwd(), 'messages', `${locale}.json`);
        console.log(`Reading ${filePath}...`);
        const content = fs.readFileSync(filePath, 'utf8');
        const messages = JSON.parse(content);

        console.log('Syncing EN to DB...');
        // We call syncBidirectional which calls syncToDb
        const results = await TranslationService.syncBidirectional(locale, 'to-db');

        console.log(`✅ Sincronización EN completada. Agregadas: ${results.added}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error en sincronización:', err);
        process.exit(1);
    }
}

sync();
