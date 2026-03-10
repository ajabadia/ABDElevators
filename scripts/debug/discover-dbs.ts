import path from 'node:path';
import { getMongoClient } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function discoverDatabases() {
    try {
        console.log('--- Discovering Databases in URIs ---');
        const client = await getMongoClient();
        const dbs = await client.db().admin().listDatabases();
        console.log('Available databases in MONGODB_URI cluster:', dbs.databases.map((db: any) => db.name));

        for (const dbInfo of dbs.databases) {
            const db = client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();
            if (collections.some(c => c.name === 'translations')) {
                const count = await db.collection('translations').countDocuments();
                console.log(`📍 Found 'translations' in [${dbInfo.name}]: ${count} docs`);
            }
        }

        await client.close();
    } catch (error: any) {
        console.error('❌ Error during discovery:', error.message);
    }
}

discoverDatabases();
