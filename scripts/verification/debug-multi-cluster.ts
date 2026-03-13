import { MongoClient } from 'mongodb';

async function debugMultiCluster() {
    console.log('[DEBUG] Investigating Multi-Cluster Database Content...');
    
    const clusters = [
        { name: 'MAIN', uri: 'mongodb+srv://abadia3d_db_user:Ajabafan1974@pruebas.nwakk9f.mongodb.net/?appName=pruebas' },
        { name: 'AUTH', uri: 'mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/' },
        { name: 'LOGS', uri: 'mongodb+srv://ajabadia04_db_user:Ajabafan1974@logs.epv9qr8.mongodb.net/' }
    ];

    for (const cluster of clusters) {
        const client = new MongoClient(cluster.uri);
        try {
            await client.connect();
            const admin = client.db().admin();
            const dbs = await admin.listDatabases();
            
            console.log(`\n[CLUSTER: ${cluster.name}] Datasets:`, dbs.databases.map(db => db.name));

            for (const dbInfo of dbs.databases) {
                if (['admin', 'local', 'config'].includes(dbInfo.name)) continue;
                const db = client.db(dbInfo.name);
                const collections = await db.listCollections().toArray();
                console.log(`  - DB: ${dbInfo.name} | Collections:`, collections.map(c => c.name));

                if (collections.some(c => c.name === 'user_documents')) {
                    const count = await db.collection('user_documents').countDocuments();
                    console.log(`    ! Found user_documents in ${dbInfo.name}: ${count}`);
                }
                if (collections.some(c => c.name === 'knowledge_assets')) {
                    const count = await db.collection('knowledge_assets').countDocuments();
                    console.log(`    ! Found knowledge_assets in ${dbInfo.name}: ${count}`);
                }
            }
        } catch (error) {
            console.error(`[CLUSTER: ${cluster.name}] Error:`, error instanceof Error ? error.message : error);
        } finally {
            await client.close();
        }
    }
    process.exit(0);
}

debugMultiCluster();
