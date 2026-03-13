import { MongoClient } from 'mongodb';

async function diagnoseClusters() {
    const uris = [
        { name: 'MAIN', url: 'mongodb+srv://abadia3d_db_user:Ajabafan1974@pruebas.nwakk9f.mongodb.net/?appName=pruebas' },
        { name: 'AUTH', url: 'mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/' },
        { name: 'CONFIG', url: 'mongodb+srv://ajabadia05_db_user:yysrjP244uFF9bSi@config.q2wc92h.mongodb.net/?appName=config' },
        { name: 'LOGS', url: 'mongodb+srv://ajabadia04_db_user:Ajabafan1974@logs.epv9qr8.mongodb.net/' }
    ];

    console.log('[DIAGNOSE] Scanning all clusters...');

    for (const cluster of uris) {
        console.log(`\n--- Cluster: ${cluster.name} ---`);
        const client = new MongoClient(cluster.url);
        try {
            await client.connect();
            const admin = client.db().admin();
            const dbs = await admin.listDatabases();
            
            for (const dbInfo of dbs.databases) {
                const db = client.db(dbInfo.name);
                const collections = await db.listCollections().toArray();
                const collNames = collections.map(c => c.name);
                
                if (collNames.includes('knowledge_assets')) {
                    const count = await db.collection('knowledge_assets').countDocuments();
                    const sample = await db.collection('knowledge_assets').findOne({});
                    console.log(`[FOUND] DB: ${dbInfo.name} | Collection: knowledge_assets | Count: ${count}`);
                    if (sample) {
                        console.log(`[SAMPLE] Status: ${sample.status}`);
                    }
                }
                
                if (collNames.includes('document_chunks')) {
                    const count = await db.collection('document_chunks').countDocuments();
                    const sample = await db.collection('document_chunks').findOne({});
                    console.log(`[FOUND] DB: ${dbInfo.name} | Collection: document_chunks | Count: ${count}`);
                    if (sample) {
                        console.log(`[SAMPLE CHUNK] Status: ${sample.status}`);
                    }
                    const chunkStatuses = await db.collection('document_chunks').distinct('status');
                    console.log(`[CHUNKS] Unique Statuses:`, chunkStatuses);
                }
            }
        } catch (error: any) {
            console.error(`[ERROR] Cluster ${cluster.name}: ${error.message}`);
        } finally {
            await client.close();
        }
    }
    process.exit(0);
}

diagnoseClusters();
