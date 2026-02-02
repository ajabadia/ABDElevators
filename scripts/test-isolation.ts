import 'dotenv/config';
import { MongoClient } from 'mongodb';

async function test() {
    console.log('Connecting to MongoDB...');
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is missing');
        process.exit(1);
    }

    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        console.log('Connected!');
        const db = client.db();
        const collection = db.collection('prompts');

        const tenantId = 'default_tenant';
        const testKey = `test_${Date.now()}`;

        // Insert in STAGING
        await collection.insertOne({
            key: testKey,
            tenantId,
            environment: 'STAGING',
            createdAt: new Date()
        });
        console.log('Inserted in STAGING');

        // Find in STAGING
        const stagingDoc = await collection.findOne({ key: testKey, environment: 'STAGING' });
        console.log('Found in STAGING:', !!stagingDoc);

        // Find in PRODUCTION
        const prodDoc = await collection.findOne({ key: testKey, environment: 'PRODUCTION' });
        console.log('Found in PRODUCTION (should be false):', !!prodDoc);

        // Cleanup
        await collection.deleteOne({ key: testKey });
        console.log('Cleanup done');
    } finally {
        await client.close();
    }
}

test().catch(console.error);
