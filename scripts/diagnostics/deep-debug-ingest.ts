import { connectDB } from '../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debugIngest() {
    try {
        const db = await connectDB();

        console.log('--- LATEST ASSETS (Last 5) ---');
        const assets = await db.collection('knowledge_assets').find({}).sort({ createdAt: -1 }).limit(5).toArray();
        console.log(JSON.stringify(assets, null, 2));

        console.log('\n--- LATEST AUDITS (Last 5) ---');
        const audits = await db.collection('audit_ingestion').find({}).sort({ timestamp: -1 }).limit(5).toArray();
        console.log(JSON.stringify(audits, null, 2));

    } catch (e) {
        console.error('Debug error:', e);
    } finally {
        process.exit(0);
    }
}

debugIngest();
