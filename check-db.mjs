
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db();
        const collections = await db.listCollections().toArray();
        console.log('Collections in database:', collections.map(c => c.name));

        const collectionName = 'translations'; // Testing if it is 'translations'
        console.log(`Checking collection: ${collectionName}`);
        const collection = db.collection(collectionName);

        console.log('Listing first 50 keys in translations collection...');
        const allDocs = await collection.find({}).limit(50).toArray();
        allDocs.forEach(doc => {
            console.log(`[${doc.locale}] ${doc.key}`);
        });

    } finally {
        await client.close();
    }
}

run().catch(console.error);
