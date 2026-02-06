
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI missing');
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const timestamp = Date.now();

        // 1. Migrar tipos_documento -> document_types
        const tipos = await db.collection('tipos_documento').find({}).toArray();
        if (tipos.length > 0) {
            console.log(`📦 Migrando ${tipos.length} tipos de documento...`);
            for (const t of tipos) {
                const { _id, ...data } = t;
                await db.collection('document_types').updateOne(
                    { nombre: t.nombre },
                    { $set: data },
                    { upsert: true }
                );
            }
            await db.collection('tipos_documento').rename(`tipos_documento_migrated_${timestamp}`);
        }

        // 2. Migrar taxonomias -> taxonomies
        const taxos = await db.collection('taxonomias').find({}).toArray();
        if (taxos.length > 0) {
            console.log(`📦 Migrando ${taxos.length} taxonomias...`);
            for (const t of taxos) {
                const { _id, ...data } = t;
                await db.collection('taxonomies').updateOne(
                    { key: t.key, tenantId: t.tenantId },
                    { $set: data },
                    { upsert: true }
                );
            }
            await db.collection('taxonomias').rename(`taxonomias_migrated_${timestamp}`);
        }

        // 3. Limpiar colecciones vacías
        const emptyLegacy = ['documentos', 'documentos_usuarios'];
        for (const col of emptyLegacy) {
            const count = await db.collection(col).countDocuments();
            if (count === 0) {
                console.log(`🗑️ Eliminando colección vacía: ${col}`);
                await db.collection(col).drop();
            }
        }

        // 4. Purgar base de datos "test"
        console.log('🧹 Purgando base de datos "test"...');
        await client.db('test').dropDatabase();

        console.log('✅ Limpieza de legado completada con éxito.');

    } catch (error: any) {
        console.error('❌ Error durante la migración:', error.message);
    } finally {
        await client.close();
    }
}

run();
