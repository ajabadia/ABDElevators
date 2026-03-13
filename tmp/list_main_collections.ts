
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listAllCollections() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('ABDElevators');

    const collections = await db.listCollections().toArray();
    console.log(JSON.stringify(collections.map(c => c.name), null, 2));

    await client.close();
}

listAllCollections().catch(console.error);
