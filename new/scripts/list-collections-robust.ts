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
        const dbs = ['ABDElevators', 'ABDElevators-Auth', 'ABDElevators-Logs'];

        for (const dbName of dbs) {
            console.log(`\n--- DB: ${dbName} ---`);
            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();
            if (collections.length === 0) {
                console.log('  (Sin colecciones o DB no existe)');
            } else {
                collections.forEach(c => console.log(`  - ${c.name}`));
            }
        }
    } finally {
        await client.close();
    }
}

listCollections();
