const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('ABDElevators');

        console.log('--- KNOWLEDGE ASSETS ---');
        const assets = await db.collection('knowledge_assets').find({}, { projection: { filename: 1, industry: 1, tenantId: 1, status: 1 } }).toArray();
        console.log(JSON.stringify(assets, null, 2));

    } finally {
        await client.close();
    }
}

run().catch(console.error);
