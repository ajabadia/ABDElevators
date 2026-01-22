import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;

async function testConnection() {
    if (!uri) {
        console.error('MONGODB_URI is missing');
        process.exit(1);
    }
    console.log('Testing connection to:', uri.split('@')[1]); // Log host only for safety
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('✅ Connection successful');
        const db = client.db('ABDElevators');
        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
    } catch (err: any) {
        console.error('❌ Connection failed:', err.message);
    } finally {
        await client.close();
    }
}

testConnection();
