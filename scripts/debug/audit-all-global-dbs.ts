import path from 'node:path';
import { getMongoClient } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function auditAllCollections() {
    try {
        const client = await getMongoClient();
        const dbNames = ['abd-rag-ascensores', 'test', 'admin'];

        for (const dbName of dbNames) {
            console.log(`\n--- DB: ${dbName} ---`);
            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();
            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();
                console.log(`- ${col.name}: ${count} docs`);
            }
        }

        await client.close();
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

auditAllCollections();
