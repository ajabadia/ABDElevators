
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function updateAsset() {
    const client = new MongoClient(process.env.MONGODB_URI || '');
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const result = await db.collection('knowledge_assets').updateOne(
            { _id: new ObjectId('698b48e7907e95bcba694d1a') },
            { $set: { tenantId: 'demo-tenant' } }
        );

        console.log(`Updated ${result.modifiedCount} asset(s).`);
    } finally {
        await client.close();
    }
}

updateAsset();
