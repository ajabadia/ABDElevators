import { MongoClient } from 'mongodb';

async function debugRaw() {
    console.log('[DEBUG] Investigating Raw Database Content...');
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abd_rag';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('abd_rag'); // Default DB name from platform conventions

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

debugRaw();
