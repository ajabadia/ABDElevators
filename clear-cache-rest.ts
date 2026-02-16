import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function clearCacheREST() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        console.error('❌ UPSTASH_REDIS_REST_URL or TOKEN missing in .env.local');
        process.exit(1);
    }

    console.log(`🧹 Iniciando limpieza de cache vía REST en ${url}...`);

    try {
        // 1. Obtener llaves que matcheen i18n:*
        const keysResponse = await fetch(`${url}/keys/i18n:*`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const keysResult = await keysResponse.json();
        const keys = keysResult.result || [];

        console.log(`📊 Encontradas ${keys.length} llaves.`);

        if (keys.length > 0) {
            // 2. Borrar llaves
            const delResponse = await fetch(`${url}/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify(['DEL', ...keys])
            });
            const delResult = await delResponse.json();
            console.log(`✅ Resultado del borrado:`, delResult);
        } else {
            console.log('ℹ️ No hay llaves de cache i18n para limpiar.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error clearing cache via REST:', err);
        process.exit(1);
    }
}

clearCacheREST();
