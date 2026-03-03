const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db();
        console.log('Database:', db.databaseName);
        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
    } finally {
        await client.close();
    }
}

run().catch(console.error);
