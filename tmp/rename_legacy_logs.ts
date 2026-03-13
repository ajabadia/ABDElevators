
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function cleanupLogs() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('ABDElevators');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '').split('T')[0];
    const oldName = 'application_logs';
    const newName = `application_logs_migrated_${timestamp}`;

    console.log(`Checking for ${oldName} in MAIN...`);
    const collections = await db.listCollections({ name: oldName }).toArray();

    if (collections.length > 0) {
        console.log(`Renaming ${oldName} to ${newName}...`);
        await db.collection(oldName).rename(newName);
        console.log('✅ Success.');
    } else {
        console.log(`⚠️  ${oldName} not found in MAIN.`);
    }

    await client.close();
}

cleanupLogs().catch(console.error);
