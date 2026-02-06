
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('ABDElevators');

        console.log('--- Document Migration: documentos_tecnicos -> knowledge_assets ---');

        const legacyDocs = await db.collection('documentos_tecnicos').find().toArray();
        console.log(`Found ${legacyDocs.length} legacy records.`);

        if (legacyDocs.length === 0) {
            console.log('No records to migrate.');
            return;
        }

        const newAssets = legacyDocs.map(doc => ({
            tenantId: doc.tenantId || 'platform_master',
            industry: 'ELEVATORS', // Default for legacy
            filename: doc.nombre_archivo || 'unnamed_legacy',
            componentType: doc.tipo_componente || 'GENERIC',
            model: doc.modelo || 'GENERIC',
            version: doc.version || '1.0',
            revisionDate: doc.fecha_revision ? new Date(doc.fecha_revision) : new Date(),
            language: doc.idioma || 'es',
            status: (doc.estado === 'vigente' ? 'active' : 'obsolete'),
            ingestionStatus: 'COMPLETED',
            totalChunks: doc.total_chunks || 0,
            fileMd5: doc.archivo_md5,
            cloudinaryUrl: doc.cloudinary_url,
            createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
            updatedAt: new Date()
        }));

        const result = await db.collection('knowledge_assets').insertMany(newAssets);
        console.log(`Successfully migrated ${result.insertedCount} records to 'knowledge_assets'.`);

        // Rename old collection to avoid confusion but keep backup
        const timestamp = Date.now();
        await db.collection('documentos_tecnicos').rename(`documentos_tecnicos_migrated_${timestamp}`);
        console.log(`Renamed 'documentos_tecnicos' to 'documentos_tecnicos_migrated_${timestamp}'`);

    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await client.close();
    }
}

migrate();
