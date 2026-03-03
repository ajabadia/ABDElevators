
import { connectAuthDB } from '../src/lib/db';
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

process.env.MONGODB_AUTH_URI = getEnv('MONGODB_AUTH_URI');
process.env.MONGODB_URI = getEnv('MONGODB_URI');

async function writeTestFlag() {
    try {
        const db = await connectAuthDB();

        console.log('--- WRITING TEST FLAG TO ELEVADORES MX ---');
        // Update the tenant with a flag
        const result = await db.collection('tenants').updateOne(
            { tenantId: 'elevadores_mx' },
            { $set: { "billing.fiscalName": "TEST FLAG WRITTEN BY AGENT " + new Date().toISOString() } }
        );

        if (result.modifiedCount > 0) {
            console.log('✅ Writes successful to MY database.');
            console.log('Please check MongoDB Compass (or the app) for fiscalName update.');
        } else {
            console.log('❌ Could not write (tenant not found?).');
        }

    } catch (e: any) {
        console.error('Error:', e);
    }
}

writeTestFlag();
