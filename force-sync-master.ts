import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { TranslationService } from './src/lib/translation-service';
import { connectDB } from './src/lib/db';

async function forceSyncMaster() {
    console.log('🚀 [i18n-force-sync] Iniciando sincronización maestra (DB -> JSON)...');
    try {
        await connectDB();

        // 1. Forzar de DB a JSON para asegurar que el JSON tiene TODO lo que hay en master
        console.log('🇺🇸 [i18n-force-sync] Sincronizando EN (DB -> JSON)...');
        const enRes = await TranslationService.syncBidirectional('en', 'to-file', 'platform_master', { force: true });
        console.log(`✅ EN: ${enRes.added} añadidas, ${enRes.updated} actualizadas.`);

        console.log('\n🇪🇸 [i18n-force-sync] Sincronizando ES (DB -> JSON)...');
        const esRes = await TranslationService.syncBidirectional('es', 'to-file', 'platform_master', { force: true });
        console.log(`✅ ES: ${esRes.added} añadidas, ${esRes.updated} actualizadas.`);

        // 2. Verificar localmente
        const enMessages = await TranslationService.loadFromLocalFile('en');
        const hasSpaces = !!enMessages.common?.spaces;

        console.log(`\n🏁 Resultado: common.spaces en en.json -> ${hasSpaces ? '✅ CONFIGURADO' : '❌ NO ENCONTRADO'}`);

        if (hasSpaces) {
            console.log('📊 Teclas:', Object.keys(enMessages.common.spaces!));
        }

        process.exit(hasSpaces ? 0 : 1);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

forceSyncMaster();
