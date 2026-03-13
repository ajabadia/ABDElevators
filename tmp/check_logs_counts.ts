
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkCounts() {
    const uri = process.env.MONGODB_LOGS_URI;
    if (!uri) throw new Error('MONGODB_LOGS_URI not found');

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('ABDElevators-Logs');

    const collections = ['logs', 'application_logs', 'user_sessions', 'usage_logs'];
    
    for (const name of collections) {
        const count = await db.collection(name).countDocuments();
        console.log(`${name}: ${count}`);
    }

    await client.close();
}

checkCounts().catch(console.error);
