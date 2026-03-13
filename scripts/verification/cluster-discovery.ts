import { MongoClient } from 'mongodb';

async function clusterDiscovery() {
    console.log('[DEBUG] Cluster Discovery...');
    const uri = 'mongodb+srv://abadia3d_db_user:Ajabafan1974@pruebas.nwakk9f.mongodb.net/?appName=pruebas';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const dbs = await client.db().admin().listDatabases();
        console.log('[DEBUG] Databases found:', dbs.databases.map(d => d.name));

        for (const dbInfo of dbs.databases) {
            if (['admin', 'local', 'config'].includes(dbInfo.name)) continue;
            const db = client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();
            console.log(`\n  [DB: ${dbInfo.name}] Collections:`, collections.map(c => c.name));
            
            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();
                if (count > 0) {
                    console.log(`    - ${col.name}: ${count} docs`);
                    if (col.name === 'knowledge_assets' || col.name === 'user_documents' || col.name === 'pedidos') {
                        const samples = await db.collection(col.name).find({}).limit(2).toArray();
                        console.log(`      Sample:`, samples.map(s => s.filename || s.originalName || s.name || s._id));
                    }
                }
            }
        }
    } catch (error) {
        console.error('[DEBUG ERROR]', error);
    } finally {
        await client.close();
    }
    process.exit(0);
}

clusterDiscovery();
