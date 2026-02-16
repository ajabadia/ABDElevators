
import { connectDB } from '../src/lib/db';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key: string) => {
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].trim().replace(/^"(.*)"$/, '$1') : undefined;
};

process.env.MONGODB_URI = getEnv('MONGODB_URI');

async function stats() {
    console.log('--- KNOWLEDGE ASSETS STATS ---');
    const db = await connectDB();
    const assets = await db.collection('knowledge_assets').find({}).toArray();

    const counts = {
        PENDING: 0,
        PROCESSING: 0,
        COMPLETED: 0,
        FAILED: 0,
        TOTAL: assets.length
    };

    assets.forEach(a => {
        const s = a.ingestionStatus || 'PENDING';
        // @ts-ignore
        counts[s] = (counts[s] || 0) + 1;
        if (s === 'PENDING' || s === 'PROCESSING' || s === 'FAILED') {
            console.log(`- ${a.filename}: ${s} (${a.progress || 0}%) ${a.error || ''}`);
        }
    });

    console.log('\nSummary:', JSON.stringify(counts, null, 2));

    // Give time to flush
    setTimeout(() => process.exit(0), 1000);
}

stats();
