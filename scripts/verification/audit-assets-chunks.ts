import { MongoClient } from 'mongodb';

async function auditAssetsAndChunks() {
    console.log('[AUDIT] Scanning MAIN Cluster for Assets and Chunks...');
    const uri = 'mongodb+srv://abadia3d_db_user:Ajabafan1974@pruebas.nwakk9f.mongodb.net/?appName=pruebas';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const admin = client.db().admin();
        const dbsInfo = await admin.listDatabases();
        const dbNames = dbsInfo.databases.map(d => d.name);
        
        console.log('[AUDIT] Databases available:', dbNames);

        for (const dbName of dbNames) {
            if (['admin', 'local', 'config'].includes(dbName)) continue;
            
            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();
            const colNames = collections.map(c => c.name);
            
            console.log(`\n--- DB: ${dbName} ---`);
            
            if (colNames.includes('knowledge_assets')) {
                const count = await db.collection('knowledge_assets').countDocuments();
                console.log(`[FOUND] knowledge_assets: ${count} documents`);
                if (count > 0) {
                    const samplesSource = await db.collection('knowledge_assets').find({}).limit(3).toArray();
                    samplesSource.forEach(s => {
                        console.log(`  - Asset: ${s.filename || s.name || s._id} | Status: ${s.ingestionStatus || s.status} | Tenant: ${s.tenantId}`);
                    });
                }
            } else {
                console.log('[NOT FOUND] knowledge_assets');
            }

            if (colNames.includes('document_chunks')) {
                const count = await db.collection('document_chunks').countDocuments();
                console.log(`[FOUND] document_chunks: ${count} documents`);
                if (count > 0) {
                    const sampleChunk = await db.collection('document_chunks').findOne({});
                    console.log(`  - Sample Chunk Text Content (30 chars): "${sampleChunk.chunkText?.substring(0, 30)}..."`);
                    console.log(`  - Parent Asset ID: ${sampleChunk.sourceDoc}`);
                }
            } else {
                console.log('[NOT FOUND] document_chunks');
            }
            
            // Check for other relevant names like 'pedidos' or 'vector_docs'
            ['user_documents', 'pedidos', 'chunks'].forEach(async (n) => {
                if (colNames.includes(n)) {
                    const c = await db.collection(n).countDocuments();
                    console.log(`[FOUND OTHER] ${n}: ${c} documents`);
                }
            });
        }

    } catch (error) {
        console.error('[AUDIT ERROR]', error);
    } finally {
        await client.close();
        process.exit(0);
    }
}

auditAssetsAndChunks();
