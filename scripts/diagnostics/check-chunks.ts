
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

async function checkChunks() {
    try {
        const db = await connectDB();

        console.log('--- CHECKING KNOWLEDGE CHUNKS (Last 30 mins) ---');
        const count = await db.collection('knowledge_chunks').countDocuments({
            createdAt: { $gt: new Date(Date.now() - 30 * 1000 * 60) }
        });

        if (count === 0) {
            console.log('❌ No chunks found in the last 30 minutes.');
        } else {
            console.log(`✅ Found ${count} chunks created recently.`);

            const sample = await db.collection('knowledge_chunks')
                .find({ createdAt: { $gt: new Date(Date.now() - 30 * 1000 * 60) } })
                .limit(2)
                .toArray();

            sample.forEach((s, i) => {
                console.log(`\nSample ${i + 1}:`);
                console.log(`Model: ${s.model} | Type: ${s.componentType}`);
                console.log(`Source: ${s.sourceDoc}`);
            });
        }

    } catch (e: any) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}

checkChunks();
