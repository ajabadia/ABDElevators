import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'ABDElevators';

async function ensureIndexes() {
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI no definida en .env.local');
        process.exit(1);
    }

    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB');

        const db = client.db(MONGODB_DB);
        const collection = db.collection('translations');

        console.log('🔍 Creando índices para la colección "translations"...');

        // Índice compuesto para búsquedas rápidas y unicidad
        // key + locale + tenantId
        await collection.createIndex(
            { key: 1, locale: 1, tenantId: 1 },
            {
                unique: true,
                name: 'idx_key_locale_tenant',
                background: true
            }
        );

        // Índice para filtrado por namespace (Panel Admin)
        await collection.createIndex(
            { namespace: 1, locale: 1 },
            { name: 'idx_namespace_locale', background: true }
        );

        // Índice para filtrado por tenant
        await collection.createIndex(
            { tenantId: 1 },
            { name: 'idx_tenant', background: true }
        );

        console.log('✅ Índices creados exitosamente.');

        const indexes = await collection.listIndexes().toArray();
        console.log('📊 Índices actuales:', indexes.map(idx => idx.name));

    } catch (error) {
        console.error('❌ Error creando índices:', error);
    } finally {
        await client.close();
    }
}

ensureIndexes();
