const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const admin = client.db().admin();
        const dbs = await admin.listDatabases();
        console.log('DATABASES_FOUND:', dbs.databases.map(db => db.name).join(', '));

        for (const dbInfo of dbs.databases) {
            const dbName = dbInfo.name;
            if (['admin', 'local', 'config'].includes(dbName)) continue;
            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();
            console.log(`DB_${dbName}_COLLECTIONS:`, collections.map(c => c.name).join(', '));
        }
    } finally {
        await client.close();
    }
}

run().catch(console.error);
