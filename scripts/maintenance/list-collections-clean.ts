
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listCollections() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not found');
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const collections = await db.listCollections().toArray();
        console.log('--- ABDElevators Collections ---');
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`${col.name}: ${count} docs`);
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.close();
    }
}

listCollections();
