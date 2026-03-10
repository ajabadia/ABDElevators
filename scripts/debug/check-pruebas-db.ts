import path from 'node:path';
import { getMongoClient } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkPruebasDb() {
    try {
        const client = await getMongoClient();
        const db = client.db('pruebas');
        const collections = await db.listCollections().toArray();
        console.log('Collections in [pruebas] DB:');
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count} docs`);
        }
        await client.close();
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

checkPruebasDb();
