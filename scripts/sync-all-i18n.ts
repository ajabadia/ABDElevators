import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import { TranslationService } from '../src/lib/translation-service';
import { connectDB } from '../src/lib/db';
import { redis } from '../src/lib/redis';

async function sync() {
    console.log('🚀 Iniciando sincronización de i18n...');

    // Check if redis is actually connected
    const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL);
    console.log(`[DEBUG] Redis Configured: ${hasRedis}`);

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
