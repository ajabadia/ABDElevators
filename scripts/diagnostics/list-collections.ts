import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function listCollections() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const collections = await db.listCollections().toArray();
        console.log('Colecciones en ABDElevators:', collections.map(c => c.name));
    } finally {
        await client.close();
    }
}

listCollections();
