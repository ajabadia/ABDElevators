import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'ABDElevators';
const COLLECTION_NAME = 'translations';

async function migrate() {
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI no encontrada');
        process.exit(1);
    }

    console.log('🚀 Iniciando migración de índices i18n...');
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const db = client.db(DATABASE_NAME);
        const collection = db.collection(COLLECTION_NAME);

        // 1. Backfill tenantId if missing (Auditoría P0)
        console.log('📦 Asegurando tenantId en documentos existentes...');
        const backfillRes = await collection.updateMany(
            { tenantId: { $exists: false } },
            { $set: { tenantId: 'platform_master' } }
        );
        console.log(`✅ ${backfillRes.modifiedCount} documentos actualizados con tenantId: 'platform_master'.`);

        // 2. Identificar y borrar índice antiguo limitado
        console.log('🔍 Buscando índices legacy...');
        const indexes = await collection.listIndexes().toArray();
        const legacyIdx = indexes.find(idx =>
            idx.key.locale === 1 && idx.key.key === 1 && Object.keys(idx.key).length === 2
        );

        if (legacyIdx) {
            console.log(`[CLEANUP] Borrando índice legacy: ${legacyIdx.name}`);
            await collection.dropIndex(legacyIdx.name);
            console.log('✅ Índice legacy borrado.');
        } else {
            console.log('ℹ️ No se encontró el índice legacy {locale:1, key:1}.');
        }

        // 3. Crear nuevo índice único COMPUESTO (Incluyendo tenantId)
        console.log('🛡️ Creando nuevo índice único de aislamiento: {locale, key, tenantId}...');
        await collection.createIndex(
            { locale: 1, key: 1, tenantId: 1 },
            { unique: true, name: 'idx_unique_translation_per_tenant' }
        );
        console.log('✅ Nuevo índice único creado.');

        // 4. Asegurar índice de consulta por obsoletos
        await collection.createIndex(
            { locale: 1, isObsolete: 1, tenantId: 1 },
            { name: 'idx_translation_lookup_smart' }
        );
        console.log('✅ Índice de consulta optimizado.');

        console.log('\n✨ Migración finalizada con éxito.');
    } catch (err) {
        console.error('💥 Error fatal en migración:', err);
    } finally {
        await client.close();
        process.exit(0);
    }
}

migrate();
