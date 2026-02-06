
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listCollectionsFor(uri: string | undefined, name: string) {
    if (!uri) {
        console.log(`\n--- [${name}] Skipped (No URI) ---`);
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const dbs = await client.db().admin().listDatabases();
        console.log(`\n--- [${name}] Cluster ---`);
        for (const dbInfo of dbs.databases) {
            console.log(`Database: ${dbInfo.name}`);
            const db = client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();
            collections.forEach(c => console.log(`   Collection: ${c.name}`));
        }
    } catch (e: any) {
        console.error(`❌ Error listing for ${name}:`, e.message);
    } finally {
        await client.close();
    }
}

async function run() {
    await listCollectionsFor(process.env.MONGODB_URI, 'MAIN');
    await listCollectionsFor(process.env.MONGODB_AUTH_URI, 'AUTH');
    await listCollectionsFor(process.env.MONGODB_LOGS_URI, 'LOGS');
    process.exit(0);
}

run();
