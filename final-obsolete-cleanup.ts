import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function clearCache() {
    console.log('🧹 Limpiando cache de i18n...');
    const upstashUrl = process.env.REDIS_URL;
    const upstashToken = process.env.REDIS_TOKEN;

    if (!upstashUrl || !upstashToken) {
        console.error('❌ REDIS_URL o REDIS_TOKEN no configurados.');
        return;
    }

    const restUrl = upstashUrl.replace('rediss://', 'https://').replace('@', '/').split('/')[0] + upstashUrl.split('@')[1];
    // Wait, upstash rest url is usually different.
    // I'll use the logic from clear-cache-rest.ts if I still had it.
    // Actually, I can just use the fetch call I used before.

    // Better: I'll just use the fetch command directly.
}

import { connectDB } from './src/lib/db';

async function cleanupObsolete() {
    console.log('🧹 Eliminando llaves obsoletas (sin prefijo common)...');
    try {
        const db = await connectDB();
        const collection = db.collection('translations');

        // Llaves que antes estaban en root y ahora están en common
        const namespacesToClean = ['spaces', 'search', 'enterpriseSecurity'];

        const result = await collection.deleteMany({
            namespace: { $in: namespacesToClean },
            locale: 'en'
        });

        console.log(`✅ Se eliminaron ${result.deletedCount} llaves EN obsoletas.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanupObsolete();
