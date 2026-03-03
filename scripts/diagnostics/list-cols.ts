import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listCollections() {
    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const cols = await db.listCollections().toArray();
        console.log('COLLECTIONS:', cols.map(c => c.name));
    } finally {
        await client.close();
    }
}
listCollections();
