import { MongoClient } from 'mongodb';

async function checkStatusField() {
    console.log('[DEBUG] Checking status field values in knowledge_assets...');
    const uri = 'mongodb+srv://abadia3d_db_user:Ajabafan1974@pruebas.nwakk9f.mongodb.net/?appName=pruebas';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const assets = await db.collection('knowledge_assets').find({}).limit(5).toArray();
        
        assets.forEach(a => {
            console.log(`Asset: ${a.filename} | status: "${a.status}" | ingestionStatus: "${a.ingestionStatus}"`);
        });

    } catch (error) {
        console.error('[DEBUG ERROR]', error);
    } finally {
        await client.close();
        process.exit(0);
    }
}

checkStatusField();
