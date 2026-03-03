const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db();

        console.log('--- Resumen de Industrias ---');
        const industryCounts = await db.collection('document_chunks').aggregate([
            { $group: { _id: '$industry', count: { $sum: 1 } } }
        ]).toArray();
        console.log(JSON.stringify(industryCounts, null, 2));

        console.log('\n--- Resumen de Tenants ---');
        const tenantCounts = await db.collection('document_chunks').aggregate([
            { $group: { _id: '$tenantId', count: { $sum: 1 } } }
        ]).toArray();
        console.log(JSON.stringify(tenantCounts, null, 2));

        console.log('\n--- Muestra de Chunks ---');
        const sample = await db.collection('document_chunks').find({}, { projection: { industry: 1, tenantId: 1, environment: 1, sourceDoc: 1 } }).limit(5).toArray();
        console.log(JSON.stringify(sample, null, 2));

    } finally {
        await client.close();
    }
}

run().catch(console.error);
