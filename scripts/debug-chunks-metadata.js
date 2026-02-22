const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('ABDElevators');

        console.log('--- STATS ---');
        const stats = await db.collection('document_chunks').aggregate([
            {
                $group: {
                    _id: { industry: '$industry', tenantId: '$tenantId', environment: '$environment' },
                    count: { $sum: 1 }
                }
            }
        ]).toArray();
        console.log(JSON.stringify(stats, null, 2));

        const sample = await db.collection('document_chunks').findOne({}, { projection: { industry: 1, tenantId: 1, environment: 1, sourceDoc: 1 } });
        console.log('\n--- SAMPLE ---');
        console.log(JSON.stringify(sample, null, 2));

    } finally {
        await client.close();
    }
}

run().catch(console.error);
