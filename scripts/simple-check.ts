
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

async function run() {
    const db = await connectDB();
    const assets = await db.collection('knowledge_assets').find({
        filename: { $regex: 'Real Decreto 203-2016', $options: 'i' }
    }).toArray();
    console.log('COUNT:' + assets.length);
    assets.forEach(a => {
        console.log(`FILE:${a.filename}|MD5:${a.fileMd5}|TENANT:${a.tenantId}|SCOPE:${a.scope}|ENV:${a.environment}`);
    });
    process.exit();
}
run();
