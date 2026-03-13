import { MongoClient } from 'mongodb';

async function checkAuthDocs() {
    console.log('[DEBUG] Checking AUTH cluster for user_documents...');
    // Derived from .env.local
    const authUri = 'mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/';
    const client = new MongoClient(authUri);

    try {
        await client.connect();
        const db = client.db('ABDElevators-Auth');
        const count = await db.collection('user_documents').countDocuments();
        console.log(`[DEBUG] user_documents in ABDElevators-Auth: ${count}`);
        
        if (count > 0) {
            const docs = await db.collection('user_documents').find({}).toArray();
            docs.forEach(d => console.log(`  - ${d.originalName} | userId: ${d.userId} | tenantId: ${d.tenantId}`));
        }

    } catch (error) {
        console.error('[DEBUG ERROR]', error);
    } finally {
        await client.close();
        process.exit(0);
    }
}

checkAuthDocs();
