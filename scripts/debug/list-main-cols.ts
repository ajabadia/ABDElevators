import path from 'node:path';
import { connectDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listCollectionsSimplified() {
    try {
        const db = await connectDB();
        const collections = await db.listCollections().toArray();
        console.log('--- MAIN DB COLLECTIONS ---');
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count} docs`);
        }
        await db.client.close();
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

listCollectionsSimplified();
