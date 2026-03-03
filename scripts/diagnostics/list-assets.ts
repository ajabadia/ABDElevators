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

async function listAssets() {
    console.log('--- LISTING KNOWLEDGE ASSETS ---');
    const db = await connectDB();
    const assets = await db.collection('knowledge_assets').find({}).sort({ createdAt: -1 }).limit(10).toArray();

    if (assets.length === 0) {
        console.log('No assets found.');
        return;
    }

    assets.forEach(asset => {
        console.log(`\nFilename: ${asset.filename}`);
        console.log(`ID: ${asset._id}`);
        console.log(`Status: ${asset.status} | Ingestion: ${asset.ingestionStatus} | Progress: ${asset.progress || 0}%`);
        console.log(`Chunks: ${asset.totalChunks || 0} | Scope: ${asset.scope} | Env: ${asset.environment}`);
        console.log(`CreatedAt: ${asset.createdAt.toISOString()}`);
    });

    process.exit(0);
}

listAssets();
