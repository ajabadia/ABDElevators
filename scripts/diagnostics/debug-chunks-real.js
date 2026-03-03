const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('ABDElevators');

        console.log('--- Resumen Document Chunks (ABDElevators) ---');
        const stats = await db.collection('document_chunks').aggregate([
            {
                $group: {
                    _id: { industry: '$industry', tenantId: '$tenantId', environment: '$environment' },
                    count: { $sum: 1 }
                }
            }
        ]).toArray();
        console.log(JSON.stringify(stats, null, 2));

        const sample = await db.collection('document_chunks').findOne();
        if (sample) {
            console.log('\n--- Muestra de Chunk ---');
            console.log(JSON.stringify(sample, null, 2));
        } else {
            console.log('\n--- No se encontraron chunks en ABDElevators.document_chunks ---');
        }

    } finally {
        await client.close();
    }
}

run().catch(console.error);
