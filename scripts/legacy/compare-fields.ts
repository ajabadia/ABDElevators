
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

async function compareFields() {
    try {
        const db = await connectDB();
        const collection = db.collection('knowledge_assets');

        const assets = await collection.find({
            filename: { $regex: 'Real Decreto 203-2016', $options: 'i' }
        }).toArray();

        console.log(`- FOUND ${assets.length} ASSETS -`);
        assets.forEach(a => {
            const env = a.environment !== undefined ? a.environment : 'MISSING';
            console.log(`MD5: ${a.fileMd5} | ENV: ${env} | Created: ${a.createdAt.toISOString()}`);
        });

    } catch (e: any) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}

compareFields();
