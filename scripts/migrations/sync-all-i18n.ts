import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// CARGAR VARIABLES DE ENTORNO ANTES DE CUALQUIER OTRA COSA
const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

console.log(`[DEBUG] UPSTASH_REDIS_REST_URL: ${process.env.UPSTASH_REDIS_REST_URL ? 'LOADED' : 'MISSING'}`);

async function sync() {
    console.log('🚀 Iniciando sincronización de i18n...');

    try {
        // Importación dinámica para evitar hoisting en ESM y asegurar que dotenv ya corrió
        const { TranslationService } = await import('../../src/services/core/translation-service');
        const { connectDB } = await import('@abd/platform-core/server');

        await connectDB();
        console.log('📡 Conexión a DB establecida.');

        console.log('🔄 Sincronizando locale: es...');
        await TranslationService.forceSyncFromLocal('es');

        console.log('🔄 Sincronizando locale: en...');
        await TranslationService.forceSyncFromLocal('en');

        console.log('✅ Sincronización completada con éxito.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error durante la sincronización:', error);
        process.exit(1);
    }
}

sync();
