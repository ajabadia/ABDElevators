import path from 'node:path';
import { connectDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkCollections() {
    try {
        console.log('--- Checking MAIN DB Collections ---');
        const mainDb = await connectDB();
        const collections = await mainDb.listCollections().toArray();
        console.log('Collections in MAIN DB:', collections.map(c => c.name));

        await mainDb.client.close();
    } catch (error: any) {
        console.error('❌ Failed to list collections:', error.message);
    }
}

checkCollections();
