
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

async function inspectDuplicates() {
    try {
        const db = await connectDB();
        const collection = db.collection('knowledge_assets');

        console.log('--- INSPECTING DUPLICATES (Specific) ---');
        const assets = await collection.find({
            filename: { $regex: 'Real Decreto 203-2016', $options: 'i' }
        }).sort({ createdAt: -1 }).toArray();

        console.log(`Found ${assets.length} documents.`);

        for (const a of assets) {
            console.log(`[${a.createdAt.toISOString()}] ID: ${a._id}`);
            console.log(`  MD5: ${a.fileMd5} | Scope: ${a.scope} | Tenant: ${a.tenantId}`);
            console.log(`  Type: ${a.componentType} | Model: ${a.model} | Env: ${a.environment}`);
            console.log(`  Status: ${a.ingestionStatus}`);
        }

    } catch (e: any) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}

inspectDuplicates();
