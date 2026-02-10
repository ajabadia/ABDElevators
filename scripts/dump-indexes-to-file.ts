import { connectDB } from '../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function dumpIndexes() {
    try {
        const db = await connectDB();
        const indexes = await db.collection('knowledge_assets').indexes();
        fs.writeFileSync(path.join(process.cwd(), 'scripts/indexes-dump.txt'), JSON.stringify(indexes, null, 2));
        console.log('INDEXES DUMPED TO scripts/indexes-dump.txt');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

dumpIndexes();
