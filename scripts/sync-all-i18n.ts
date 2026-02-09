import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.join(process.cwd(), '.env.local');
console.log(`[DEBUG] CWD: ${process.cwd()}`);
console.log(`[DEBUG] Buscando .env.local en: ${envPath}`);

if (fs.existsSync(envPath)) {
    console.log(`[DEBUG] .env.local existe.`);
} else {
    console.log(`[DEBUG] .env.local NO existe.`);
}

// CARGAR VARIABLES DE ENTORNO ANTES DE CUALQUIER OTRA IMPORTACIÓN
dotenv.config({ path: envPath });

console.log(`[DEBUG] MONGODB_URI: ${process.env.MONGODB_URI ? 'LOADED' : 'MISSING'}`);
console.log(`[DEBUG] UPSTASH_REDIS_REST_URL: ${process.env.UPSTASH_REDIS_REST_URL ? 'LOADED' : 'MISSING'}`);

import { TranslationService } from '../src/lib/translation-service';
import { connectDB } from '../src/lib/db';

async function sync() {
    console.log('🚀 Iniciando sincronización de i18n...');

    try {
        // Asegurar conexión a DB
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
