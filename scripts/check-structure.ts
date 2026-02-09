
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

async function checkStructure() {
    try {
        const db = await connectDB();
        const collection = db.collection('knowledge_assets');

        console.log('--- CHECKING Structure ---');
        const asset = await collection.findOne({
            filename: { $regex: 'Real Decreto 203-2016', $options: 'i' }
        });

        if (!asset) {
            console.log('❌ No documents found.');
        } else {
            console.log(JSON.stringify(asset, null, 2));
        }

    } catch (e: any) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}

checkStructure();
