import { MongoClient } from 'mongodb';

async function debugAtlasFinal() {
    console.log('[DEBUG] Final Atlas Insight...');
    
    // Config from .env.local
    const mainUri = 'mongodb+srv://abadia3d_db_user:Ajabafan1974@pruebas.nwakk9f.mongodb.net/?appName=pruebas';
    const authUri = 'mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/';

    try {
        // 1. Check Knowledge Assets in Main Cluster
        const mainClient = new MongoClient(mainUri);
        await mainClient.connect();
        const mainDb = mainClient.db('ABDElevators-Main');
        const kAssets = await mainDb.collection('knowledge_assets').find({}).toArray();
        console.log(`\n[MAIN CLUSTER] DB: ABDElevators-Main | knowledge_assets count: ${kAssets.length}`);
        kAssets.forEach(a => console.log(`  - ${a.filename} | Status: ${a.status} | Ingest: ${a.ingestionStatus}`));
        await mainClient.close();

        // 2. Check User Documents in Auth Cluster
        const authClient = new MongoClient(authUri);
        await authClient.connect();
        const authDb = authClient.db('ABDElevators-Auth');
        const uDocs = await authDb.collection('user_documents').find({}).toArray();
        console.log(`\n[AUTH CLUSTER] DB: ABDElevators-Auth | user_documents count: ${uDocs.length}`);
        uDocs.forEach(d => console.log(`  - ${d.originalName} | userId: ${d.userId} | tenantId: ${d.tenantId}`));
        await authClient.close();

    } catch (error) {
        console.error('[DEBUG ERROR]', error);
    }
    process.exit(0);
}

debugAtlasFinal();
