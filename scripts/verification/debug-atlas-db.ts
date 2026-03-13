import { MongoClient } from 'mongodb';

async function debugRawAtlas() {
    console.log('[DEBUG] Investigating Raw Atlas Database Content...');
    // Derived from .env.local
    const uri = 'mongodb+srv://abadia3d_db_user:Ajabafan1974@pruebas.nwakk9f.mongodb.net/?appName=pruebas';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(); // Use default db from URI

        const uDocs = await db.collection('user_documents').find({}).toArray();
        const kAssets = await db.collection('knowledge_assets').find({}).toArray();

        console.log(`[DEBUG] Total user_documents: ${uDocs.length}`);
        uDocs.forEach(d => console.log(` - ${d.originalName} (Tenant: ${d.tenantId}, User: ${d.userId}, Status: ${d.status || 'N/A'})`));

        console.log(`[DEBUG] Total knowledge_assets: ${kAssets.length}`);
        kAssets.forEach(a => console.log(` - ${a.filename} (Tenant: ${a.tenantId}, Status: ${a.status}, IngestStatus: ${a.ingestionStatus})`));

    } catch (error) {
        console.error('[DEBUG ERROR]', error);
    } finally {
        await client.close();
        process.exit(0);
    }
}

debugRawAtlas();
