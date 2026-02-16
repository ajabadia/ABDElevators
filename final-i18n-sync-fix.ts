import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { TranslationService } from './src/lib/translation-service';
import { connectDB } from './src/lib/db';
import { redis } from './src/lib/redis';

async function finalSyncFix() {
    console.log('🚀 Iniciando sincronización final y corrección de visibilidad...');
    try {
        const db = await connectDB();
        const collection = db.collection('translations');

        // 1. Limpiar llaves rebeldes sin tenantId o con tenantId incorrecto que coincidan con common.spaces
        console.log('🧹 Limpiando registros inconsistentes de common.spaces...');
        const deleteResult = await collection.deleteMany({
            key: { $regex: /^common\.spaces/ },
            tenantId: { $ne: 'platform_master' }
        });
        console.log(`✅ Registros eliminados: ${deleteResult.deletedCount}`);

        // 2. Sincronización PROFUNDA (JSON -> DB) para asegurar que todo esté en platform_master
        console.log('Syncing ES...');
        await TranslationService.syncBidirectional('es', 'to-db', 'platform_master');
        console.log('Syncing EN...');
        await TranslationService.syncBidirectional('en', 'to-db', 'platform_master');

        // 3. Corregir CUALQUIER llave de common.spaces que haya quedado sin tenantId (solo por seguridad)
        console.log('🛡️ Asegurando tenantId en base de datos...');
        const updateResult = await collection.updateMany(
            { key: { $regex: /^common\.spaces/ }, tenantId: { $exists: false } },
            { $set: { tenantId: 'platform_master' } }
        );
        console.log(`✅ Registros corregidos: ${updateResult.modifiedCount}`);

        // 4. PURGA TOTAL de Caché i18n
        console.log('🧹 Purgando caché de Redis...');
        const keys = await redis.keys('i18n:*');
        if (keys.length > 0) {
            await redis.del(...keys);
            console.log(`✅ Caché eliminada (${keys.length} entradas)`);
        }

        console.log('✨ Proceso completado satisfactoriamente.');

        // Verificación final rápida
        const count = await collection.countDocuments({
            key: { $regex: /^common\.spaces/ },
            locale: 'en',
            tenantId: 'platform_master',
            isObsolete: false
        });
        console.log(`📊 Total llaves EN en BD (platform_master): ${count}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

finalSyncFix();
