import { connectDB } from '../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkAudits() {
    try {
        const db = await connectDB();
        const collection = db.collection('audit_ingestion');
        const audits = await collection.find({}).sort({ timestamp: -1 }).limit(10).toArray();

        console.log('--- RECENT INGESTION AUDITS ---');
        console.log(JSON.stringify(audits, null, 2));
    } catch (e) {
        console.error('Error checking audits:', e);
    } finally {
        process.exit(0);
    }
}

checkAudits();
