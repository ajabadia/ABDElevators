
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

async function checkIndexes() {
    try {
        const db = await connectDB();
        const collection = db.collection('knowledge_assets');

        const indexes = await collection.indexes();
        console.log('--- INDEXES ON knowledge_assets ---');
        console.log(JSON.stringify(indexes, null, 2));

    } catch (e: any) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}

checkIndexes();
