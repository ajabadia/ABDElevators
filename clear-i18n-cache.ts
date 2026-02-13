import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Importar redis DESPUÉS de cargar el env
import { redis } from './src/lib/redis';

async function clearCache() {
    console.log('🧹 Limpiando cache de i18n en Redis...');
    try {
        const keys = await redis.keys('i18n:*');
        console.log(`📊 Encontradas ${keys.length} llaves de cache.`);

        if (keys.length > 0) {
            for (const key of keys) {
                await redis.del(key);
                console.log(`   - Eliminada: ${key}`);
            }
            console.log('✅ Cache de i18n limpiado correctamente.');
        } else {
            console.log('ℹ️ No hay llaves de cache i18n para limpiar.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

clearCache();
