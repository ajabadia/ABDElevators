
import { connectDB } from '../src/lib/db';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key: string) => {
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].trim().replace(/^"(.*)$/, '$1') : undefined;
};

process.env.MONGODB_URI = getEnv('MONGODB_URI');

async function cleanup() {
    try {
        const db = await connectDB();

        console.log('--- STARTING DATABASE CLEANUP ---');

        const assetsCount = await db.collection('knowledge_assets').countDocuments();
        await db.collection('knowledge_assets').deleteMany({});
        console.log(`🗑️ Deleted ${assetsCount} from knowledge_assets`);

        const chunksCount = await db.collection('knowledge_chunks').countDocuments();
        await db.collection('knowledge_chunks').deleteMany({});
        console.log(`🗑️ Deleted ${chunksCount} from knowledge_chunks`);

        const auditCount = await db.collection('audit_ingestion').countDocuments();
        await db.collection('audit_ingestion').deleteMany({});
        console.log(`🗑️ Deleted ${auditCount} from audit_ingestion`);

        console.log('--- CLEANUP COMPLETED ---');

    } catch (e: any) {
        console.error('Error during cleanup:', e);
    } finally {
        process.exit();
    }
}

cleanup();
