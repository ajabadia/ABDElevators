import path from 'node:path';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listDbsInAuthCluster() {
    const authUri = process.env.MONGODB_AUTH_URI || process.env.MONGODB_URI;
    if (!authUri) {
        console.error('Missing MONGODB_AUTH_URI');
        return;
    }

    const client = new MongoClient(authUri);
    try {
        await client.connect();
        const dbs = await client.db().admin().listDatabases();
        console.log('--- DBs in AUTH cluster ---');
        dbs.databases.forEach(db => console.log(`- ${db.name}`));
    } catch (error: any) {
        console.error('Error:', error.message);
    } finally {
        await client.close();
    }
}

listDbsInAuthCluster();
