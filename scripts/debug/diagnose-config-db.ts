import path from 'node:path';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function diagnose() {
    const uri = process.env.MONGODB_CONFIG_URI || process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_CONFIG_URI o MONGODB_URI no encontradas en .env.local');
        return;
    }

    const redactedUri = uri.replace(/:([^@]+)@/, ':****@');
    console.log(`🔍 Diagnosticando conexión a: ${redactedUri}`);

    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('✅ Conexión exitosa.');

        const db = client.db('ABDElevators-Config');
        console.log(`📂 Base de datos seleccionada: ${db.databaseName}`);

        const stats = await db.command({ dbStats: 1 });
        console.log('📊 Estadísticas de la DB:', JSON.stringify(stats, null, 2));

        const admin = client.db('admin');
        try {
            const listDatabases = await admin.command({ listDatabases: 1 });
            console.log('📋 Lista de bases de datos en el cluster:');
            for (const d of listDatabases.databases) {
                console.log(`   - ${d.name} (${(d.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);

                // Inspeccionar colecciones si es local o admin
                if (d.name === 'local') {
                    const localDb = client.db('local');
                    const collections = await localDb.listCollections().toArray();
                    for (const col of collections) {
                        try {
                            const collStats = await localDb.command({ collStats: col.name });
                            console.log(`      🔸 ${col.name}: ${(collStats.size / 1024 / 1024).toFixed(2)} MB (storage: ${(collStats.storageSize / 1024 / 1024).toFixed(2)} MB)`);
                        } catch (e) {
                            console.log(`      🔸 ${col.name}: [Sin permisos para stats]`);
                        }
                    }
                }
            }
        } catch (e) {
            console.log('⚠️ No se pudo listar todas las bases de datos o colecciones (falta de permisos de admin).');
        }

    } catch (error) {
        console.error('❌ Error de diagnóstico:', error);
    } finally {
        await client.close();
    }
}

diagnose();
