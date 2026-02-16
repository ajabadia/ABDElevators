import dotenv from 'dotenv';
import path from 'path';
// Forzar carga de .env.local ANTES de importar servicios
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { TranslationService } from './src/lib/translation-service';
import { connectDB } from './src/lib/db';
import { redis } from './src/lib/redis';

async function finalSync() {
    console.log('🚀 Iniciando Sincronización Final...');
    try {
        await connectDB();

        // 1. Purga TOTAL de Redis (desde el cliente configurado)
        console.log('🧹 Limpiando Redis i18n:*...');
        const keys = await redis.keys('i18n:*');
        if (keys.length > 0) {
            await redis.del(...keys);
            console.log(`✅ ${keys.length} llaves eliminadas de Redis.`);
        } else {
            console.log('ℹ️ No se encontraron llaves i18n en Redis.');
        }

        // 2. Sincronizar ES (Principal) -> DB
        console.log('🇪🇸 Sincronizando ES a DB (platform_master)...');
        await TranslationService.syncBidirectional('es', 'to-db', 'platform_master');

        // 3. Sincronizar EN (Secundario) -> DB
        console.log('🇺🇸 Sincronizando EN a DB (platform_master)...');
        await TranslationService.syncBidirectional('en', 'to-db', 'platform_master');

        // 4. Verificación final directa DESDE EL SERVICIO
        console.log('🧪 Verificando persistencia y merge...');
        const enMessages = await TranslationService.getMessages('en', 'platform_master');
        const hasSpaces = !!enMessages.common?.spaces;

        console.log(`\n🏁 Resultado Final: common.spaces en EN -> ${hasSpaces ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO'}`);

        if (hasSpaces) {
            const count = Object.keys(enMessages.common.spaces).length;
            console.log(`📊 Claves en common.spaces: ${count}`);
        }

        process.exit(hasSpaces ? 0 : 1);
    } catch (err) {
        console.error('💥 Error fatal:', err);
        process.exit(1);
    }
}

finalSync();
