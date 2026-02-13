import dotenv from 'dotenv';
import path from 'path';
// 1. Cargar entorno ANTES de nada
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { TranslationService } from './src/lib/translation-service';
import { connectDB } from './src/lib/db';
import { redis } from './src/lib/redis';

/**
 * 🚀 Script de Sincronización Inteligente de i18n
 */
async function syncIntelligent() {
    console.log('🚀 [i18n-smart-sync] Iniciando ciclo de sincronización inteligente...');

    try {
        await connectDB();

        // 1. Purga de Redis para empezar de cero
        console.log('🧹 [i18n-smart-sync] Purgando caché Redis (i18n:*)...');
        const keys = await redis.keys('i18n:*');
        if (keys.length > 0) {
            await redis.del(...keys);
            console.log(`✅ [i18n-smart-sync] ${keys.length} entradas eliminadas.`);
        }

        // 2. Sincronización SMART a BD (JSON -> DB)
        // Esto detectará discrepancias y actualizará la BD si el JSON tiene valores distintos
        console.log('\n🇪🇸 [i18n-smart-sync] Sincronizando ES (JSON -> DB)...');
        const esRes = await TranslationService.syncBidirectional('es', 'to-db', 'platform_master', { force: false });
        console.log(`✅ ES: ${esRes.added} añadidas, ${esRes.updated} actualizadas.`);

        console.log('\n🇺🇸 [i18n-smart-sync] Sincronizando EN (JSON -> DB)...');
        const enRes = await TranslationService.syncBidirectional('en', 'to-db', 'platform_master', { force: false });
        console.log(`✅ EN: ${enRes.added} añadidas, ${enRes.updated} actualizadas.`);

        // 3. Forzar visibilidad de common.spaces
        // Si por casualidad common.spaces solo existe en DB, lo traemos al JSON
        console.log('\n🔍 [i18n-smart-sync] Asegurando visibilidad de common.spaces en JSON...');
        await TranslationService.syncBidirectional('es', 'to-file', 'platform_master', { force: true });
        await TranslationService.syncBidirectional('en', 'to-file', 'platform_master', { force: true });

        // 4. Verificación Post-Sync
        const finalEn = await TranslationService.getMessages('en', 'platform_master');
        const hasSpaces = !!finalEn.common?.spaces;

        console.log(`\n🏁 [i18n-smart-sync] Resultado: common.spaces en EN -> ${hasSpaces ? '✅ VISIBLE' : '❌ OCULTO'}`);

        if (hasSpaces) {
            console.log('📊 Teclas en common.spaces:', Object.keys(finalEn.common.spaces));
        }

        process.exit(hasSpaces ? 0 : 1);
    } catch (err) {
        console.error('💥 [i18n-smart-sync] Error fatal:', err);
        process.exit(1);
    }
}

syncIntelligent();
