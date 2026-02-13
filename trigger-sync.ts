import { connectDB } from './src/lib/db';
import { TranslationService } from './src/lib/translation-service';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function sync() {
    console.log('🚀 Iniciando sincronización manual...');
    try {
        await connectDB();

        console.log('\n--- Sincronizando ES ---');
        const esResult = await TranslationService.syncBidirectional('es', 'to-db', 'platform_master');
        console.log('✅ ES Result:', esResult);

        console.log('\n--- Sincronizando EN ---');
        const enResult = await TranslationService.syncBidirectional('en', 'to-db', 'platform_master');
        console.log('✅ EN Result:', enResult);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error fatal:', err);
        process.exit(1);
    }
}

sync();
