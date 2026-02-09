
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

async function getFailedAsset() {
    const db = await connectDB();
    const asset = await db.collection('knowledge_assets').findOne({ ingestionStatus: 'FAILED' });
    if (asset) {
        console.log('--- FAILED ASSET DETAILS ---');
        console.log(`Filename: ${asset.filename}`);
        console.log(`Error: ${asset.error}`);
        console.log(`Cloudinary URL: ${asset.cloudinaryUrl}`);
        console.log(`CreatedAt: ${asset.createdAt.toISOString()}`);
    } else {
        console.log('No failed assets found.');
    }
    process.exit(0);
}

getFailedAsset();
