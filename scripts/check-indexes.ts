import { connectDB } from '../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkIndexes() {
    try {
        const db = await connectDB();
        const indexes = await db.collection('knowledge_assets').indexes();
        console.log('--- INDEXES ON knowledge_assets ---');
        console.log(JSON.stringify(indexes, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

checkIndexes();
