import { connectDB } from '../src/lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkIndexes() {
    console.log('--- Checking Atlas Search Indexes on document_chunks ---');
    try {
        const db = await connectDB();
        const collection = db.collection('document_chunks');

        // aggregate with $listSearchIndexes is the robust way to check across driver versions
        const indexes = await collection.aggregate([{ $listSearchIndexes: {} }]).toArray();

        console.log(JSON.stringify(indexes, null, 2));
    } catch (error: any) {
        console.error('❌ Error checking indexes:', error.message);
    } finally {
        process.exit(0);
    }
}

checkIndexes();
