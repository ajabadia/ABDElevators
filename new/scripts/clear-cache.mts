import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function clear() {
    console.log('--- 🧹 i18n Cache Clear Tool ---');
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;

    if (!redisUrl) {
        console.error('❌ Error: REDIS_URL o UPSTASH_REDIS_REST_URL no encontradas en .env.local');
        process.exit(1);
    }

    console.log('Conectando a Redis...');

    // Si la URL empieza por https (Upstash REST), ioredis no funcionará directamente si es solo REST.
    // Pero UPSTASH_REDIS_REST_URL suele ir acompañada de una REDIS_URL de ioredis o similar.
    // Intentamos conectar con REDIS_URL.

    const client = new Redis(redisUrl);

    try {
        const keys = ['i18n:platform_master:es', 'i18n:platform_master:en'];
        console.log(`Borrando llaves: ${keys.join(', ')}`);

        for (const key of keys) {
            await client.del(key);
            console.log(`✅ Llave ${key} borrada.`);
        }

        console.log('\nCaché de traducciones limpiado con éxito.');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error durante la limpieza de caché:', error);
        process.exit(1);
    } finally {
        await client.quit();
    }
}

clear();
