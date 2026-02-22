const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const admin = client.db().admin();
        const dbs = await admin.listDatabases();
        console.log('Databases available:', dbs.databases.map(db => db.name));

        for (const dbInfo of dbs.databases) {
            const dbName = dbInfo.name;
            if (['admin', 'local', 'config'].includes(dbName)) continue;

            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();
            const chunkColl = collections.find(c => c.name === 'document_chunks');
            if (chunkColl) {
                const count = await db.collection('document_chunks').countDocuments();
                console.log(`DB [${dbName}] has document_chunks: ${count} documents`);
                if (count > 0) {
                    const sample = await db.collection('document_chunks').findOne();
                    console.log(`Sample from [${dbName}]:`, JSON.stringify(sample, null, 2));
                }
            } else {
                console.log(`DB [${dbName}] has NO document_chunks collection`);
            }
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.close();
    }
}

run().catch(console.error);
